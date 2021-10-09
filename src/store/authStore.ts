import type { HashStore, KeyMaterial } from "../transport/cryption";
import type { Unsubscribe, User } from "firebase/auth";
import { defineStore } from "pinia";
import { FirebaseError } from "firebase/app";
import { getAuthMaterial, setAuthMaterial } from "../transport/wrapper";
import { useToast } from "vue-toastification";
import {
	derivePKey,
	newDataEncryptionKeyMaterial,
	newMaterialFromOldKey,
} from "../transport/cryption";
import {
	createUserWithEmailAndPassword,
	EmailAuthProvider,
	getAuth,
	onAuthStateChanged,
	reauthenticateWithCredential,
	signInWithEmailAndPassword,
	signOut,
	updatePassword,
} from "firebase/auth";

type LoginProcessState = "AUTHENTICATING" | "GENERATING_KEYS" | "FETCHING_KEYS" | "DERIVING_PKEY";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		email: null as string | null,
		uid: null as string | null,
		pKey: null as HashStore | null,
		loginProcessState: null as LoginProcessState | null,
		authStateWatcher: null as null | Unsubscribe,
	}),
	actions: {
		clearCache() {
			this.pKey?.destroy();
			this.pKey = null;
			this.uid = null;
			this.email = null;
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
			this.email = user.email;
			this.uid = user.uid;
		},
		async onSignedOut() {
			this.clearCache();
			console.log("Cleared user ID");

			const [{ useAccountsStore }, { useTransactionsStore }] = await Promise.all([
				import("./accountsStore"),
				import("./transactionsStore"),
			]);
			const accounts = useAccountsStore();
			const transactions = useTransactionsStore();

			accounts.clearCache();
			console.log("Cleared accounts cache");
			transactions.clearCache();
			console.log("Cleared transactions cache");
		},
		async login(email: string, password: string) {
			try {
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
		async createVault(email: string, password: string) {
			try {
				const auth = getAuth();
				this.loginProcessState = "AUTHENTICATING";
				const { user } = await createUserWithEmailAndPassword(auth, email, password);

				this.loginProcessState = "GENERATING_KEYS";
				const material = await newDataEncryptionKeyMaterial(password);
				await setAuthMaterial(user.uid, material);

				this.loginProcessState = "DERIVING_PKEY";
				this.pKey = derivePKey(password, material.passSalt);
				this.onSignedIn(user);
			} finally {
				// In any event, error or not:
				this.loginProcessState = null;
			}
		},
		async updatePassword(oldPassword: string, newPassword: string) {
			const auth = getAuth();
			const user = auth.currentUser;
			const email = this.email;
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
		handleAuthError(error: unknown) {
			const toast = useToast();

			let message: string;
			if (error instanceof Error) {
				message = error.message;
			} else if (error instanceof FirebaseError) {
				message = error.code;
			} else {
				message = JSON.stringify(error);
			}

			if (message.includes("auth/invalid-email")) {
				toast.error("That doesn't quite look like an email address");
			} else if (
				message.includes("auth/wrong-password") ||
				message.includes("auth/user-not-found")
			) {
				toast.error("Incorrect email address or password.");
			} else if (message.includes("auth/email-already-in-use")) {
				toast.error("Someone already has an account with that email.");
			} else {
				toast.error(message);
			}
			console.error(error);
		},
		async logout() {
			const auth = getAuth();
			await signOut(auth);
		},
	},
});
