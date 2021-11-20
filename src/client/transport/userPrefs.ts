import type { DocumentReference, QueryDocumentSnapshot } from "firebase/firestore";
import type { EPackage, HashStore } from "./cryption";
import type { LocationPref } from "./locations";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, recordFromSnapshot } from "./db";
import { encrypt } from "./cryption";

export interface UserPreferences {
	locationSensitivity: LocationPref;
}
interface UserPreferencesRecordPackageMetadata {
	objectType: "UserPreferences";
}
type UserPreferencesRecordPackage = EPackage<UserPreferencesRecordPackageMetadata>;

export function defaultPrefs(this: void): UserPreferences {
	return {
		locationSensitivity: "none",
	};
}

function isUserPreferences(tbd: unknown): tbd is UserPreferences {
	return (
		typeof tbd === "object" &&
		tbd !== null &&
		tbd !== undefined &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"locationSensitivity" in tbd &&
		["none", "vague", "specific"].includes((tbd as UserPreferences).locationSensitivity)
	);
}

export function userRef(uid: string): DocumentReference<UserPreferencesRecordPackage> {
	const path = `users/${uid}`;
	return doc(db, path) as DocumentReference<UserPreferencesRecordPackage>;
}

export async function setUserPreferences(
	uid: string,
	prefs: Partial<UserPreferences>,
	dek: HashStore
): Promise<void> {
	const meta: UserPreferencesRecordPackageMetadata = {
		objectType: "UserPreferences",
	};
	const record: UserPreferences = {
		locationSensitivity: prefs.locationSensitivity ?? "none",
	};
	const pkg = encrypt(record, meta, dek);
	await setDoc(userRef(uid), pkg);
}

export async function deleteUserPreferences(uid: string): Promise<void> {
	await deleteDoc(userRef(uid));
}

export function userPreferencesFromSnapshot(
	doc: QueryDocumentSnapshot<UserPreferencesRecordPackage>,
	dek: HashStore
): UserPreferences {
	const { record } = recordFromSnapshot(doc, dek, isUserPreferences);
	return record;
}
