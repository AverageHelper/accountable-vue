import type { KeyMaterial } from "./cryption";
import type { DocumentReference } from "firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./db";

function authRef(uid: string): DocumentReference<KeyMaterial> {
	const path = `users/${uid}/keys/main`;
	return doc(db, path) as DocumentReference<KeyMaterial>;
}

export async function getAuthMaterial(uid: string): Promise<KeyMaterial | null> {
	const snap = await getDoc(authRef(uid));
	const material = snap.data() ?? null;
	if (material === null) return null;

	return material;
}

export async function setAuthMaterial(uid: string, data: KeyMaterial): Promise<void> {
	await setDoc(authRef(uid), data);
}
