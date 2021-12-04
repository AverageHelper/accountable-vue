import type { EPackage, HashStore } from "./cryption";
import type { LocationRecordParams } from "../model/Location";
import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "firebase/firestore";
import { db, recordFromSnapshot } from "./db";
import { encrypt } from "./cryption";
import { Location } from "../model/Location";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";

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
	dek: HashStore,
	batch?: WriteBatch
): Promise<Location> {
	const meta: LocationRecordPackageMetadata = {
		objectType: "Location",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = doc(locationsCollection(uid));
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return new Location(ref.id, record.title, record);
}

export async function updateLocation(
	uid: string,
	location: Location,
	dek: HashStore,
	batch?: WriteBatch
): Promise<void> {
	const meta: LocationRecordPackageMetadata = {
		objectType: "Location",
	};
	const record: LocationRecordParams = location.toRecord();
	const pkg = encrypt(record, meta, dek);
	const ref = locationRef(uid, location);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteLocation(
	uid: string,
	location: Location,
	batch?: WriteBatch
): Promise<void> {
	const ref = locationRef(uid, location);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}