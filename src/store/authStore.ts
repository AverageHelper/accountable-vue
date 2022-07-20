import type { DatabaseSchema } from "../model/DatabaseSchema";
import type { HashStore, KeyMaterial, Unsubscribe, UserPreferences } from "../transport";
import type { User } from "../transport/auth.js";
import { bootstrap, updateUserStats } from "./uiStore";
import { get, writable } from "svelte/store";
import { stores } from "./stores";
import { UnauthorizedError } from "../../server/errors";
import { v4 as uuid } from "uuid";
import {
	defaultPrefs,
	deleteAuthMaterial,
	deleteUserPreferences,
	deriveDEK,
	derivePKey,
	db as auth,
	getDoc,
	getAuthMaterial,
	hashed,
	newDataEncryptionKeyMaterial,
	newMaterialFromOldKey,
	setAuthMaterial,
	setUserPreferences,
	userPreferencesFromSnapshot,
	userRef,
	watchRecord,
} from "../transport";
import {
	createUserWithAccountIdAndPassword,
	deleteUser,
	refreshSession,
	signInWithAccountIdAndPassword,
	signOut,
	updateAccountId,
	updatePassword as _updatePassword,
} from "../transport/auth.js";

type LoginProcessState = "AUTHENTICATING" | "GENERATING_KEYS" | "FETCHING_KEYS" | "DERIVING_PKEY";

export const isNewLogin = writable(false);
export const accountId = writable<string | null>(null);
export const uid = writable<string | null>(null);
export const pKey = writable<HashStore | null>(null);
export const loginProcessState = writable<LoginProcessState | null>(null);
export const preferences = writable(defaultPrefs());
export const userPrefsWatcher = writable<Unsubscribe | null>(null);

export const isSignupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === "true";
export const isLoginEnabled = import.meta.env.VITE_ENABLE_LOGIN === "true";

export function clearAuthCache(): void {
	const watcher = get(userPrefsWatcher);
	if (watcher) watcher(); // needs to die before auth watcher
	userPrefsWatcher.set(null);
	get(pKey)?.destroy();
	pKey.set(null);
	loginProcessState.set(null);
	uid.set(null);
	accountId.set(null);
	isNewLogin.set(false);
	preferences.set(defaultPrefs());
	console.debug("authStore: cache cleared");
}

export function lockVault(): void {
	get(pKey)?.destroy();
	pKey.set(null);
	isNewLogin.set(false);
	loginProcessState.set(null);
	console.debug("authStore: keys forgotten, vault locked");
}

export function onSignedIn(user: User): void {
	accountId.set(user.accountId);
	uid.set(user.uid);

	const watcher = get(userPrefsWatcher);
	if (watcher) {
		watcher();
		userPrefsWatcher.set(null);
	}

	const key = get(pKey);
	if (key === null) return; // No decryption key

	const userDoc = userRef(user.uid);
	userPrefsWatcher.set(
		watchRecord(userDoc, async snap => {
			const { dekMaterial } = await getDekMaterial();
			const dek = deriveDEK(key, dekMaterial);
			if (snap.exists()) {
				const prefs = userPreferencesFromSnapshot(snap, dek);
				preferences.set(prefs);
			} else {
				preferences.set(defaultPrefs());
			}
		})
	);
}

export async function onSignedOut(): Promise<void> {
	clearAuthCache();

	const { accounts } = await stores();
	const { clearAttachmentsCache } = await import("./attachmentsStore");
	const { clearLocationsCache } = await import("./locationsStore");
	const { clearTagsCache } = await import("./tagsStore");
	const { clearTransactionsCache } = await import("./transactionsStore");
	accounts.clearCache();
	clearAttachmentsCache();
	clearLocationsCache();
	clearTagsCache();
	clearTransactionsCache();
}

export async function fetchSession(): Promise<void> {
	bootstrap();
	try {
		loginProcessState.set("AUTHENTICATING");
		// Salt using the user's account ID
		const { user } = await refreshSession(auth);
		await updateUserStats();
		onSignedIn(user);
	} catch (error) {
		console.error(error);
	} finally {
		// In any event, error or not:
		loginProcessState.set(null);
	}
}

export async function unlockVault(password: string): Promise<void> {
	const acctId = get(accountId);
	if (get(uid) === null || acctId === null) throw new UnauthorizedError("missing-token");

	await login(acctId, password);

	// TODO: Instead of re-authing, download the ledger and attempt a decrypt with the given password. If fail, throw. If succeed, continue.
}

export async function login(accountId: string, password: string): Promise<void> {
	try {
		loginProcessState.set("AUTHENTICATING");
		// TODO: Also salt the password hash
		// Salt using the user's account ID
		const { user } = await signInWithAccountIdAndPassword(
			auth,
			accountId,
			await hashed(password) // FIXME: Should use OPAQUE or SRP instead
		);
		await updateUserStats();

		// Get the salt and dek material from server
		loginProcessState.set("FETCHING_KEYS");
		const material = await getDekMaterial();

		// Derive a pKey from the password, and remember it
		loginProcessState.set("DERIVING_PKEY");
		pKey.set(await derivePKey(password, material.passSalt));
		onSignedIn(user);
	} finally {
		// In any event, error or not:
		loginProcessState.set(null);
	}
}

export async function getDekMaterial(this: void): Promise<KeyMaterial> {
	const user = auth.currentUser;
	if (!user) throw new Error("You must sign in first"); // TODO: I18N

	const material = await getAuthMaterial(user.uid);
	if (!material) throw new Error("You must create an accout first"); // TODO: I18N
	return material;
}

export function createAccountId(this: void): string {
	return uuid().replace(/\W+/gu, "");
}

export async function createVault(accountId: string, password: string): Promise<void> {
	try {
		loginProcessState.set("AUTHENTICATING");
		const { user } = await createUserWithAccountIdAndPassword(
			auth,
			accountId,
			await hashed(password)
		);

		loginProcessState.set("GENERATING_KEYS");
		const material = await newDataEncryptionKeyMaterial(password);
		await setAuthMaterial(user.uid, material);
		await updateUserStats();

		loginProcessState.set("DERIVING_PKEY");
		pKey.set(await derivePKey(password, material.passSalt));
		isNewLogin.set(true);
		onSignedIn(user);
	} finally {
		// In any event, error or not:
		loginProcessState.set(null);
	}
}

export function clearNewLoginStatus(): void {
	isNewLogin.set(false);
}

export async function destroyVault(password: string): Promise<void> {
	if (!auth.currentUser) throw new Error("Not signed in to any account."); // TODO: I18N

	const { accounts } = await stores();
	const { deleteAllAttachments } = await import("./attachmentsStore");
	const { deleteAllLocation } = await import("./locationsStore");
	const { deleteAllTags } = await import("./tagsStore");
	const { deleteAllTransactions } = await import("./transactionsStore");

	// The execution order is important here:
	await deleteAllAttachments();
	await deleteAllTransactions();
	await deleteAllTags();
	await accounts.deleteAllAccounts();
	await deleteAllLocation();
	await deleteUserPreferences(auth.currentUser.uid);
	await deleteAuthMaterial(auth.currentUser.uid);

	await deleteUser(auth, auth.currentUser, await hashed(password));
	await onSignedOut();
}

export async function updateUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	await setUserPreferences(userId, prefs, dek);
	await updateUserStats();
}

export async function regenerateAccountId(currentPassword: string): Promise<void> {
	const user = auth.currentUser;
	if (user === null) {
		throw new Error("Not logged in"); // TODO: I18N
	}

	const newAccountId = createAccountId();
	await updateAccountId(user, newAccountId, await hashed(currentPassword));
	accountId.set(newAccountId);
	isNewLogin.set(true);
}

export async function updatePassword(oldPassword: string, newPassword: string): Promise<void> {
	const user = auth.currentUser;
	if (user === null) {
		throw new Error("Not logged in"); // TODO: I18N
	}

	// Get old DEK material
	const oldMaterial = await getAuthMaterial(user.uid);
	if (!oldMaterial) {
		throw new Error("Create an account first"); // TODO: I18N
	}

	// Generate new pKey
	const newMaterial = await newMaterialFromOldKey(oldPassword, newPassword, oldMaterial);

	// Store new pKey
	await setAuthMaterial(user.uid, newMaterial);
	pKey.set(await derivePKey(newPassword, newMaterial.passSalt));
	delete newMaterial.oldDekMaterial;
	delete newMaterial.oldPassSalt;

	// Update auth password
	try {
		await _updatePassword(auth, user, await hashed(oldPassword), await hashed(newPassword));
	} catch (error) {
		// Overwrite the new key with the old key, and have user try again
		await setAuthMaterial(user.uid, oldMaterial);
		pKey.set(await derivePKey(oldPassword, oldMaterial.passSalt));
		throw error;
	}

	// Erase the old key
	await setAuthMaterial(user.uid, newMaterial);
	await updateUserStats();
}

export async function logout(): Promise<void> {
	await signOut(auth);
	await onSignedOut();
}

export async function getAllUserDataAsJson(): Promise<DatabaseSchema> {
	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const {
		accounts: accountsStore, //
	} = await stores();
	const { getAllAttachmentsAsJson } = await import("./attachmentsStore");
	const { getAllLocationsAsJson } = await import("./locationsStore");
	const { getAllTagsAsJson } = await import("./tagsStore");

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const userDoc = userRef(userId);
	const snap = await getDoc(userDoc);

	const [accounts, attachments, locations, tags] = await Promise.all([
		accountsStore.getAllAccountsAsJson(),
		getAllAttachmentsAsJson(),
		getAllLocationsAsJson(),
		getAllTagsAsJson(),
	]);

	const prefs = snap.exists() //
		? userPreferencesFromSnapshot(snap, dek)
		: defaultPrefs();

	// JS seems to put these in the order we lay them. Do prefs first, since they're smol
	return {
		uid: userId,
		...prefs,
		accounts,
		attachments,
		locations,
		tags,
	};
}
