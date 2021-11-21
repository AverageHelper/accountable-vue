import type { AccountsDownloadable } from "./accountsStore";
import type { HashStore, KeyMaterial, UserPreferences } from "../transport";
import type { Unsubscribe, User } from "firebase/auth";
import { defineStore } from "pinia";
import { getDoc } from "firebase/firestore";
import { stores } from "./stores";
import { v4 as uuid } from "uuid";
import {
	defaultPrefs,
	deleteAuthMaterial,
	deleteUserPreferences,
	deriveDEK,
	derivePKey,
	getAuthMaterial,
	newDataEncryptionKeyMaterial,
	newMaterialFromOldKey,
	setAuthMaterial,
	setUserPreferences,
	userPreferencesFromSnapshot,
	userRef,
	watchRecord,
} from "../transport";
import {
	createUserWithEmailAndPassword,
	deleteUser,
	EmailAuthProvider,
	getAuth,
	onAuthStateChanged,
	reauthenticateWithCredential,
	signInWithEmailAndPassword,
	signOut,
	updateEmail,
	updatePassword,
} from "firebase/auth";

export interface UserDataDownloadable extends UserPreferences {
	uid: string;
	accounts: AccountsDownloadable;
}

type LoginProcessState = "AUTHENTICATING" | "GENERATING_KEYS" | "FETCHING_KEYS" | "DERIVING_PKEY";

function emailFromAccountId(accountId: string): string;
function emailFromAccountId(accountId: null): null;
function emailFromAccountId(accountId: string | null): string | null;
function emailFromAccountId(accountId: string | null): string | null {
	if (accountId === null) return null;
	// @example.com is meant as a dummy domain that doesn't 404. Sending emails to it should be fine, since all we usually send are UUID usernames
	return `${accountId}@example.com`;
}

function accountIdFromEmail(email: string): string;
function accountIdFromEmail(email: null): null;
function accountIdFromEmail(email: string | null): string | null;
function accountIdFromEmail(email: string | null): string | null {
	if (email === null) return null;
	const result = email.split("@")[0] ?? "";
	if (!result) {
		throw new TypeError(`${email} is not a valid email address`);
	}
	return result;
}

export const useAuthStore = defineStore("auth", {
	state: () => ({
		isNewLogin: false,
		accountId: null as string | null,
		uid: null as string | null,
		pKey: null as HashStore | null,
		loginProcessState: null as LoginProcessState | null,
		preferences: defaultPrefs(),
		authStateWatcher: null as null | Unsubscribe,
		userPrefsWatcher: null as null | Unsubscribe,
	}),
	actions: {
		clearCache() {
			if (this.userPrefsWatcher) this.userPrefsWatcher(); // needs to die before auth watcher
			this.userPrefsWatcher = null;
			if (this.authStateWatcher) this.authStateWatcher();
			this.authStateWatcher = null;
			this.pKey?.destroy();
			this.pKey = null;
			this.loginProcessState = null;
			this.uid = null;
			this.accountId = null;
			this.isNewLogin = false;
			this.preferences = defaultPrefs();
			console.log("authStore: cache cleared");
		},
		watchAuthState() {
			if (this.authStateWatcher) this.authStateWatcher();

			const auth = getAuth();
			this.authStateWatcher = onAuthStateChanged(auth, user => {
				if (user === null) {
					// Signed out
					void this.onSignedOut();
				}
			});
		},
		onSignedIn(user: User) {
			this.accountId = accountIdFromEmail(user.email);
			this.uid = user.uid;

			if (this.userPrefsWatcher) {
				this.userPrefsWatcher();
				this.userPrefsWatcher = null;
			}

			const pKey = this.pKey as HashStore | null;
			if (pKey === null) return; // No decryption key

			const userDoc = userRef(user.uid);
			this.userPrefsWatcher = watchRecord(userDoc, async snap => {
				const { dekMaterial } = await this.getDekMaterial();
				const dek = deriveDEK(pKey, dekMaterial);
				if (snap.exists()) {
					const prefs = userPreferencesFromSnapshot(snap, dek);
					this.preferences = prefs;
				} else {
					this.preferences = defaultPrefs();
				}
			});
		},
		async onSignedOut() {
			this.clearCache();

			const { accounts, attachments, tags, transactions } = await stores();
			accounts.clearCache();
			attachments.clearCache();
			tags.clearCache();
			transactions.clearCache();
		},
		async login(accountId: string, password: string) {
			try {
				const email = emailFromAccountId(accountId);
				const auth = getAuth();
				this.loginProcessState = "AUTHENTICATING";
				const { user } = await signInWithEmailAndPassword(auth, email, password);

				// Get the salt and dek material from Firestore
				this.loginProcessState = "FETCHING_KEYS";
				const material = await this.getDekMaterial();

				// Derive a pKey from the password, and remember it
				this.loginProcessState = "DERIVING_PKEY";
				this.pKey = derivePKey(password, material.passSalt);
				this.onSignedIn(user);
			} finally {
				// In any event, error or not:
				this.loginProcessState = null;
			}
		},
		async getDekMaterial(): Promise<KeyMaterial> {
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) throw new Error("You must sign in first");

			const material = await getAuthMaterial(user.uid);
			if (!material) throw new Error("You must create an accout first");
			return material;
		},
		createAccountId(this: void): string {
			const id = uuid();
			return id.replace(/\W+/gu, "");
		},
		async createVault(accountId: string, password: string) {
			try {
				const email = emailFromAccountId(accountId);
				const auth = getAuth();
				this.loginProcessState = "AUTHENTICATING";
				const { user } = await createUserWithEmailAndPassword(auth, email, password);

				this.loginProcessState = "GENERATING_KEYS";
				const material = await newDataEncryptionKeyMaterial(password);
				await setAuthMaterial(user.uid, material);

				this.loginProcessState = "DERIVING_PKEY";
				this.pKey = derivePKey(password, material.passSalt);
				this.isNewLogin = true;
				this.onSignedIn(user);
			} finally {
				// In any event, error or not:
				this.loginProcessState = null;
			}
		},
		clearNewLoginStatus() {
			this.isNewLogin = false;
		},
		async destroyVault(password: string) {
			const auth = getAuth();
			const email = emailFromAccountId(this.accountId);
			if (!auth.currentUser || email === null) throw new Error("Not signed in to any account.");

			const oldCredential = EmailAuthProvider.credential(email, password);
			await reauthenticateWithCredential(auth.currentUser, oldCredential);

			const { accounts, attachments, tags, transactions } = await stores();
			await attachments.deleteAllAttachments();
			await transactions.deleteAllTransactions();
			await tags.deleteAllTags();
			await accounts.deleteAllAccounts();
			await deleteUserPreferences(auth.currentUser.uid);
			await deleteAuthMaterial(auth.currentUser.uid);

			await deleteUser(auth.currentUser);
			await this.onSignedOut();
		},
		async updateUserPreferences(prefs: Partial<UserPreferences>) {
			const uid = this.uid;
			const pKey = this.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await this.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await setUserPreferences(uid, prefs, dek);
		},
		async regenerateAccountId(currentPassword: string) {
			const auth = getAuth();
			const user = auth.currentUser;
			const currentEmail = emailFromAccountId(this.accountId);
			if (user === null || currentEmail === null) {
				throw new Error("Not logged in");
			}

			const credential = EmailAuthProvider.credential(currentEmail, currentPassword);
			await reauthenticateWithCredential(user, credential);

			const newEmail = emailFromAccountId(this.createAccountId());
			await updateEmail(user, newEmail);
			this.accountId = accountIdFromEmail(newEmail);
			this.isNewLogin = true;
		},
		async updatePassword(oldPassword: string, newPassword: string) {
			const auth = getAuth();
			const user = auth.currentUser;
			const email = emailFromAccountId(this.accountId);
			if (user === null || email === null) {
				throw new Error("Not logged in");
			}

			const oldCredential = EmailAuthProvider.credential(email, oldPassword);
			await reauthenticateWithCredential(user, oldCredential);

			// Get old DEK material
			const oldMaterial = await getAuthMaterial(user.uid);
			if (!oldMaterial) {
				throw new Error("Create an account first");
			}

			// Generate new pKey
			const newMaterial = await newMaterialFromOldKey(oldPassword, newPassword, oldMaterial);

			// Store new pKey
			await setAuthMaterial(user.uid, newMaterial);
			this.pKey = derivePKey(newPassword, newMaterial.passSalt);
			delete newMaterial.oldDekMaterial;
			delete newMaterial.oldPassSalt;

			// Update auth password
			try {
				await updatePassword(user, newPassword);
			} catch (error: unknown) {
				// Overwrite the new key with the old key, and have user try again
				await setAuthMaterial(user.uid, oldMaterial);
				this.pKey = derivePKey(oldPassword, oldMaterial.passSalt);
				throw error;
			}

			// Erase the old key
			await setAuthMaterial(user.uid, newMaterial);
		},
		async logout() {
			const auth = getAuth();
			await signOut(auth);
			await this.onSignedOut();
		},
		async getAllUserDataAsJson(): Promise<UserDataDownloadable> {
			const uid = this.uid;
			const pKey = this.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { useAccountsStore } = await import("./accountsStore");
			const accountsStore = useAccountsStore();

			const { dekMaterial } = await this.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const userDoc = userRef(uid);
			const snap = await getDoc(userDoc);
			const accounts = await accountsStore.getAllAccountsAsJson();

			const prefs = snap.exists() //
				? userPreferencesFromSnapshot(snap, dek)
				: defaultPrefs();

			return {
				uid,
				...prefs, // JS seems to put these in the order we lay them. Do prefs first, since they're smol
				accounts,
			};
		},
	},
});
