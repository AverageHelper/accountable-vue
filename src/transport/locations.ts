import type { EPackage, HashStore } from "./cryption";
import type { Location, LocationRecordParams } from "../model/Location";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";
import { encrypt } from "./cryption";
import { isLocationRecord, location, recordFromLocation } from "../model/Location";
import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";

export const locationPrefs = ["none", "vague" /* , "specific"*/] as const;

export type LocationPref = typeof locationPrefs[number];

export type LocationRecordPackage = EPackage<"Location">;

function locationRef(location: Location): DocumentReference<LocationRecordPackage> {
	return doc<LocationRecordPackage>(db, "locations", location.id);
}

export function locationsCollection(): CollectionReference<LocationRecordPackage> {
	return collection<LocationRecordPackage>(db, "locations");
}

export function locationFromSnapshot(
	doc: QueryDocumentSnapshot<LocationRecordPackage>,
	dek: HashStore
): Location {
	const { id, record } = recordFromSnapshot(doc, dek, isLocationRecord);
	return location({
		id,
		coordinate: record.coordinate
			? {
					lat: record.coordinate.lat,
					lng: record.coordinate.lng,
			  }
			: null,
		lastUsed: record.lastUsed,
		subtitle: record.subtitle,
		title: record.title,
	});
}

export async function createLocation(
	uid: string,
	record: LocationRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Location> {
	const pkg = encrypt(record, "Location", dek);
	const ref = doc(locationsCollection());
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return location({
		id: ref.id,
		coordinate: record.coordinate
			? {
					lat: record.coordinate.lat,
					lng: record.coordinate.lng,
			  }
			: null,
		lastUsed: record.lastUsed,
		subtitle: record.subtitle,
		title: record.title,
	});
}

export async function updateLocation(
	location: Location,
	dek: HashStore,
	batch?: WriteBatch
): Promise<void> {
	const record = recordFromLocation(location);
	const pkg = encrypt(record, "Location", dek);
	const ref = locationRef(location);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteLocation(location: Location, batch?: WriteBatch): Promise<void> {
	const ref = locationRef(location);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
