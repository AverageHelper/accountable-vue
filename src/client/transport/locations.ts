import type { EPackage, HashStore } from "./cryption";
import type { LocationRecordParams } from "../model/Location";
import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, recordFromSnapshot } from "./db";
import { encrypt } from "./cryption";
import { Location } from "../model/Location";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";

export type LocationPref = "none" | "vague" | "specific";
export const locationPrefs: ReadonlyArray<LocationPref> = ["none", "vague" /* , "specific"*/];

interface LocationRecordPackageMetadata {
	objectType: "Location";
}
type LocationRecordPackage = EPackage<LocationRecordPackageMetadata>;

function locationRef(uid: string, location: Location): DocumentReference<LocationRecordPackage> {
	const path = `users/${uid}/locations/${location.id}`;
	return doc(db, path) as DocumentReference<LocationRecordPackage>;
}

export function locationsCollection(uid: string): CollectionReference<LocationRecordPackage> {
	const path = `users/${uid}/locations`;
	return collection(db, path) as CollectionReference<LocationRecordPackage>;
}

export function locationFromSnapshot(
	doc: QueryDocumentSnapshot<LocationRecordPackage>,
	dek: HashStore
): Location {
	const { id, record } = recordFromSnapshot(doc, dek, Location.isRecord);
	return new Location(id, record.title, record);
}

export async function createLocation(
	uid: string,
	record: LocationRecordParams,
	dek: HashStore
): Promise<Location> {
	const meta: LocationRecordPackageMetadata = {
		objectType: "Location",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = await addDoc(locationsCollection(uid), pkg);
	return new Location(ref.id, record.title, record);
}

export async function updateLocation(
	uid: string,
	location: Location,
	dek: HashStore
): Promise<void> {
	const meta: LocationRecordPackageMetadata = {
		objectType: "Location",
	};
	const record: LocationRecordParams = location.toRecord();
	const pkg = encrypt(record, meta, dek);
	await setDoc(locationRef(uid, location), pkg);
}

export async function deleteLocation(uid: string, location: Location): Promise<void> {
	await deleteDoc(locationRef(uid, location));
}
