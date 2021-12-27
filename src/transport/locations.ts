import type { EPackage, HashStore } from "./cryption";
import type { LocationRecordParams } from "../model/Location";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";
import { encrypt } from "./cryption";
import { Location } from "../model/Location";
import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";

export type LocationPref = "none" | "vague" | "specific";
export const locationPrefs: ReadonlyArray<LocationPref> = ["none", "vague" /* , "specific"*/];

interface LocationRecordPackageMetadata {
	objectType: "Location";
}
export type LocationRecordPackage = EPackage<LocationRecordPackageMetadata>;

function locationRef(uid: string, location: Location): DocumentReference<LocationRecordPackage> {
	return doc<LocationRecordPackage>(db, "locations", location.id);
}

export function locationsCollection(uid: string): CollectionReference<LocationRecordPackage> {
	return collection<LocationRecordPackage>(db, "locations");
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
