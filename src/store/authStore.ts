import type { DEKMaterial } from "../transport/cryption";
import { defineStore } from "pinia";
import { getAuthMaterial, setAuthMaterial } from "../transport/wrapper";
import { HashStore, derivePKey, newDataEncryptionKeyMaterial } from "../transport/cryption";
import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
} from "firebase/auth";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		uid: null as string | null,
		dekMaterial: null as DEKMaterial | null,
		pKey: null as HashStore | null,
	}),
	actions: {
		watchAuthState() {
			const auth = getAuth();
			onAuthStateChanged(auth, user => {
				if (user === null) {
					// Signed out
					this.uid = null;
					this.pKey?.destroy();
					this.pKey = null;
					this.dekMaterial = null;
				} else {
					// Signed in
					this.uid = user.uid;
				}
			});
		},
		async login(email: string, password: string) {
			const auth = getAuth();
			await signInWithEmailAndPassword(auth, email, password);

			// Get the salt and dek material from Firestore
			const material = await getAuthMaterial();
			if (!material) {
				throw new Error("You must create an account first.");
			}

			// Derive a pKey from the password, and remember it
			this.pKey = new HashStore(derivePKey(password, material.passSalt));
		},
		async createVault(email: string, password: string) {
			const auth = getAuth();
			await createUserWithEmailAndPassword(auth, email, password);

			const material = await newDataEncryptionKeyMaterial(password);
			await setAuthMaterial(material);
			this.pKey = new HashStore(derivePKey(password, material.passSalt));
		},
		async logout() {
			const auth = getAuth();
			await signOut(auth);
		},
	},
});
