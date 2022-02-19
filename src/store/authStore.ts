import type { DatabaseSchema } from "../model/DatabaseSchema";
import type { HashStore, KeyMaterial, Unsubscribe, UserPreferences } from "../transport";
import type { User } from "../transport/auth.js";
import { defineStore } from "pinia";
import { stores } from "./stores";
import { useUiStore } from "./uiStore";
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
	signInWithAccountIdAndPassword,
	signOut,
	updateAccountId,
	updatePassword,
} from "../transport/auth.js";

type LoginProcessState = "AUTHENTICATING" | "GENERATING_KEYS" | "FETCHING_KEYS" | "DERIVING_PKEY";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		isNewLogin: false,
		accountId: null as string | null,
		uid: null as string | null,
		pKey: null as HashStore | null,
		loginProcessState: null as LoginProcessState | null,
		preferences: defaultPrefs(),
		userPrefsWatcher: null as null | Unsubscribe,
	}),
	actions: {
		clearCache() {
			if (this.userPrefsWatcher) this.userPrefsWatcher(); // needs to die before auth watcher
			this.userPrefsWatcher = null;
			this.pKey?.destroy();
			this.pKey = null;
			this.loginProcessState = null;
			this.uid = null;
			this.accountId = null;
			this.isNewLogin = false;
			this.preferences = defaultPrefs();
			console.debug("authStore: cache cleared");
		},
		onSignedIn(user: User) {
			this.accountId = user.accountId;
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
			const uiStore = useUiStore();
			try {
				this.loginProcessState = "AUTHENTICATING";
				// TODO: Also salt the password hash
				// Salt using the user's account ID
				const { user } = await signInWithAccountIdAndPassword(
					auth,
					accountId,
					await hashed(password)
				);
				await uiStore.updateUserStats();

				// Get the salt and dek material from Firestore
				this.loginProcessState = "FETCHING_KEYS";
				const material = await this.getDekMaterial();

				// Derive a pKey from the password, and remember it
				this.loginProcessState = "DERIVING_PKEY";
				this.pKey = await derivePKey(password, material.passSalt);
				this.onSignedIn(user);
			} finally {
				// In any event, error or not:
				this.loginProcessState = null;
			}
		},
		async getDekMaterial(this: void): Promise<KeyMaterial> {
			const user = auth.currentUser;
			if (!user) throw new Error("You must sign in first");

			const material = await getAuthMaterial(user.uid);
			if (!material) throw new Error("You must create an accout first");
			return material;
		},
		createAccountId(this: void): string {
			return uuid().replace(/\W+/gu, "");
		},
		async createVault(accountId: string, password: string) {
			const uiStore = useUiStore();
			try {
				this.loginProcessState = "AUTHENTICATING";
				const { user } = await createUserWithAccountIdAndPassword(
					auth,
					accountId,
					await hashed(password)
				);

				this.loginProcessState = "GENERATING_KEYS";
				const material = await newDataEncryptionKeyMaterial(password);
				await setAuthMaterial(user.uid, material);
				await uiStore.updateUserStats();

				this.loginProcessState = "DERIVING_PKEY";
				this.pKey = await derivePKey(password, material.passSalt);
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
			if (!auth.currentUser) throw new Error("Not signed in to any account.");

			const { accounts, attachments, locations, tags, transactions } = await stores();
			await attachments.deleteAllAttachments();
			await transactions.deleteAllTransactions();
			await tags.deleteAllTags();
			await accounts.deleteAllAccounts();
			await locations.deleteAllLocation();
			await deleteUserPreferences(auth.currentUser.uid);
			await deleteAuthMaterial(auth.currentUser.uid);

			await deleteUser(auth, auth.currentUser, await hashed(password));
			await this.onSignedOut();
		},
		async updateUserPreferences(prefs: Partial<UserPreferences>) {
			const uiStore = useUiStore();
			const uid = this.uid;
			const pKey = this.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await this.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await setUserPreferences(uid, prefs, dek);
			await uiStore.updateUserStats();
		},
		async regenerateAccountId(currentPassword: string) {
			const user = auth.currentUser;
			if (user === null) {
				throw new Error("Not logged in");
			}

			const newAccountId = this.createAccountId();
			await updateAccountId(user, newAccountId, await hashed(currentPassword));
			this.accountId = newAccountId;
			this.isNewLogin = true;
		},
		async updatePassword(oldPassword: string, newPassword: string) {
			const uiStore = useUiStore();
			const user = auth.currentUser;
			if (user === null) {
				throw new Error("Not logged in");
			}

			// Get old DEK material
			const oldMaterial = await getAuthMaterial(user.uid);
			if (!oldMaterial) {
				throw new Error("Create an account first");
			}

			// Generate new pKey
			const newMaterial = await newMaterialFromOldKey(oldPassword, newPassword, oldMaterial);

			// Store new pKey
			await setAuthMaterial(user.uid, newMaterial);
			this.pKey = await derivePKey(newPassword, newMaterial.passSalt);
			delete newMaterial.oldDekMaterial;
			delete newMaterial.oldPassSalt;

			// Update auth password
			try {
				await updatePassword(auth, user, await hashed(oldPassword), await hashed(newPassword));
			} catch (error: unknown) {
				// Overwrite the new key with the old key, and have user try again
				await setAuthMaterial(user.uid, oldMaterial);
				this.pKey = await derivePKey(oldPassword, oldMaterial.passSalt);
				throw error;
			}

			// Erase the old key
			await setAuthMaterial(user.uid, newMaterial);
			await uiStore.updateUserStats();
		},
		async logout() {
			await signOut(auth);
			await this.onSignedOut();
		},
		async getAllUserDataAsJson(): Promise<DatabaseSchema> {
			const uid = this.uid;
			const pKey = this.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const {
				accounts: accountsStore,
				attachments: attachmentsStore,
				locations: locationsStore,
				tags: tagsStore,
			} = await stores();

			const { dekMaterial } = await this.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const userDoc = userRef(uid);
			const snap = await getDoc(userDoc);

			const [accounts, attachments, locations, tags] = await Promise.all([
				accountsStore.getAllAccountsAsJson(),
				attachmentsStore.getAllAttachmentsAsJson(),
				locationsStore.getAllLocationsAsJson(),
				tagsStore.getAllTagsAsJson(),
			]);

			const prefs = snap.exists() //
				? userPreferencesFromSnapshot(snap, dek)
				: defaultPrefs();

			// JS seems to put these in the order we lay them. Do prefs first, since they're smol
			return {
				uid,
				...prefs,
				accounts,
				attachments,
				locations,
				tags,
			};
		},
	},
});
