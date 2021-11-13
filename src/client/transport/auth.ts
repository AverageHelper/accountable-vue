import type { KeyMaterial } from "./cryption";
import type { DocumentReference } from "firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./db";

export type LocationPref = "none" | "vague" | "specific";
export const locationPrefs: ReadonlyArray<LocationPref> = ["none", "vague", "specific"];

export interface UserPreferences {
	locationSensitivity: LocationPref;
}

function userRef(uid: string): DocumentReference<UserPreferences> {
	const path = `users/${uid}`;
	return doc(db, path) as DocumentReference<UserPreferences>;
}

export function defaultPrefs(this: void): UserPreferences {
	return {
		locationSensitivity: "none",
	};
}

export async function getUserPreferences(uid: string): Promise<UserPreferences> {
	const snap = await getDoc(userRef(uid));
	// TODO: We'll need to decrypt here
	const prefs = snap.data() ?? defaultPrefs();
	return {
		...defaultPrefs(), // in case the payload is incomplete
		...prefs, // override defaults with what's stored
	};
}

export async function setUserPreferences(uid: string): Promise<void> {
	// TODO: We'll need to encrypt here
}

function authRef(uid: string): DocumentReference<KeyMaterial> {
	const path = `users/${uid}/keys/main`;
	return doc(db, path) as DocumentReference<KeyMaterial>;
}

export async function getAuthMaterial(uid: string): Promise<KeyMaterial | null> {
	const snap = await getDoc(authRef(uid));
	return snap.data() ?? null;
}

export async function setAuthMaterial(uid: string, data: KeyMaterial): Promise<void> {
	await setDoc(authRef(uid), data);
}
