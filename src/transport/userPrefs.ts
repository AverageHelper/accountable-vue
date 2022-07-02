import type { DocumentReference, QueryDocumentSnapshot } from "./db";
import type { EPackage, HashStore } from "./cryption";
import type { LocationPref } from "./locations";
import { db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";
import { encrypt } from "./cryption";
import { locationPrefs } from "./locations";

export interface UserPreferences {
	locationSensitivity: LocationPref;
}

export type UserPreferencesRecordPackage = EPackage<"UserPreferences">;

export function defaultPrefs(this: void): UserPreferences {
	return {
		locationSensitivity: "none",
	};
}

function isUserPreferences(tbd: unknown): tbd is UserPreferences {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"locationSensitivity" in tbd &&
		locationPrefs.includes((tbd as UserPreferences).locationSensitivity)
	);
}

export function userRef(uid: string): DocumentReference<UserPreferencesRecordPackage> {
	return doc<UserPreferencesRecordPackage>(db, "users", uid);
}

export async function setUserPreferences(
	uid: string,
	prefs: Partial<UserPreferences>,
	dek: HashStore
): Promise<void> {
	const record: UserPreferences = {
		locationSensitivity: prefs.locationSensitivity ?? "none",
	};
	const pkg = encrypt(record, "UserPreferences", dek);
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
