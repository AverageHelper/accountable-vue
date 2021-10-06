// import type { DEKMaterial } from "../transport/cryption";
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
		pKey: null as HashStore | null,
	}),
	actions: {
		watchAuthState() {
			const auth = getAuth();
			onAuthStateChanged(auth, user => {
				if (user === null) {
					// Signed out
					console.log("Logged out");
					this.uid = null;
					this.pKey?.destroy();
					this.pKey = null;
				} else {
					// Signed in
					console.log("Logged in", user);
					this.uid = user.uid;
				}
			});
		},
		async login(email: string, password: string) {
			const auth = getAuth();
			const { user } = await signInWithEmailAndPassword(auth, email, password);

			// Get the salt and dek material from Firestore
			let material = await getAuthMaterial(user.uid);
			if (!material) {
				material = await newDataEncryptionKeyMaterial(password);
				await setAuthMaterial(user.uid, material);
			}

			// Derive a pKey from the password, and remember it
			const pKey = derivePKey(password, material.passSalt);
			this.pKey = new HashStore(pKey);
			this.uid = user.uid;
		},
		async createVault(email: string, password: string) {
			const auth = getAuth();
			const { user } = await createUserWithEmailAndPassword(auth, email, password);

			const material = await newDataEncryptionKeyMaterial(password);
			await setAuthMaterial(user.uid, material);

			const pKey = derivePKey(password, material.passSalt);
			this.pKey = new HashStore(pKey);
			this.uid = user.uid;
		},
		async logout() {
			const auth = getAuth();
			await signOut(auth);
			this.uid = null;
		},
	},
});
