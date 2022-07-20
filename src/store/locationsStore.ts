import type { Location, LocationRecordParams } from "../model/Location";
import type { LocationRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { LocationSchema } from "../model/DatabaseSchema";
import { derived, get, writable } from "svelte/store";
import { getDekMaterial, pKey, uid } from "./authStore";
import { location, recordFromLocation } from "../model/Location";
import { transaction } from "../model/Transaction";
import { updateUserStats } from "./uiStore";
import chunk from "lodash/chunk";
import {
	createLocation as _createLocation,
	deriveDEK,
	getDocs,
	updateLocation as _updateLocation,
	deleteLocation as _deleteLocation,
	locationFromSnapshot,
	locationsCollection,
	watchAllRecords,
	writeBatch,
} from "../transport";

export const locations = writable<Record<string, Location>>({}); // Location.id -> Location
export const locationsLoadError = writable<Error | null>(null);
export const locationsWatcher = writable<Unsubscribe | null>(null);

export const allLocations = derived(locations, $locations => {
	return Object.values($locations);
});

export function clearLocationsCache(): void {
	const watcher = get(locationsWatcher);
	if (watcher) {
		watcher();
		locationsWatcher.set(null);
	}
	locations.set({});
	locationsLoadError.set(null);
	console.debug("locationsStore: cache cleared");
}

export async function watchLocations(force: boolean = false): Promise<void> {
	const watcher = get(locationsWatcher);
	if (watcher && !force) return;

	if (watcher) {
		watcher();
		locationsWatcher.set(null);
	}

	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = locationsCollection();
	locationsLoadError.set(null);
	locationsWatcher.set(
		watchAllRecords(
			collection,
			snap => {
				snap.docChanges().forEach(change => {
					switch (change.type) {
						case "removed":
							locations.update(locations => {
								const copy = { ...locations };
								delete copy[change.doc.id];
								return copy;
							});
							break;

						case "added":
						case "modified":
							locations.update(locations => {
								const copy = { ...locations };
								copy[change.doc.id] = locationFromSnapshot(change.doc, dek);
								return copy;
							});
							break;
					}
				});
			},
			error => {
				locationsLoadError.set(error);
				const watcher = get(locationsWatcher);
				if (watcher) watcher();
				locationsWatcher.set(null);
				console.error(error);
			}
		)
	);
}

export async function createLocation(
	record: LocationRecordParams,
	batch?: WriteBatch
): Promise<Location> {
	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	// If the record matches the title and coords of an extant location, return that instead
	const extantLocation = record.coordinate
		? // coordinate matches
		  get(allLocations).find(
				l =>
					record.coordinate?.lat === l.coordinate?.lat &&
					record.coordinate?.lng === l.coordinate?.lng &&
					record.title === l.title
		  )
		: // title matches
		  get(allLocations).find(l => record.title === l.title && record.subtitle === l.subtitle);

	const newLocation = extantLocation ?? (await _createLocation(userId, record, dek, batch));
	if (!batch) await updateUserStats();

	locations.update(locations => {
		const copy = { ...locations };
		copy[newLocation.id] = newLocation;
		return copy;
	});
	return newLocation;
}

export async function updateLocation(location: Location, batch?: WriteBatch): Promise<void> {
	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	await _updateLocation(location, dek, batch);
	if (!batch) await updateUserStats();
	locations.update(locations => {
		const copy = { ...locations };
		copy[location.id] = location;
		return copy;
	});
}

export async function deleteAllLocation(): Promise<void> {
	for (const locations of chunk(get(allLocations), 500)) {
		const batch = writeBatch();
		await Promise.all(locations.map(l => deleteLocation(l, batch)));
		await batch.commit();
	}
}

export async function deleteLocation(location: Location, batch?: WriteBatch): Promise<void> {
	// Transaction views should gracefully handle the
	// case where their linked location does not exist

	await _deleteLocation(location, batch);
	locations.update(locations => {
		const copy = { ...locations };
		delete copy[location.id];
		return copy;
	});
	if (!batch) await updateUserStats();
}

export async function getAllLocations(): Promise<void> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = locationsCollection();
	const snap = await getDocs<LocationRecordPackage>(collection);
	snap.docs
		.map(doc => locationFromSnapshot(doc, dek))
		.forEach(l => {
			locations.update(locations => {
				const copy = { ...locations };
				copy[l.id] = l;
				return copy;
			});
		});
}

export async function getAllLocationsAsJson(): Promise<Array<LocationSchema>> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = locationsCollection();
	const snap = await getDocs<LocationRecordPackage>(collection);
	return snap.docs
		.map(doc => locationFromSnapshot(doc, dek))
		.map(t => ({ ...recordFromLocation(t), id: t.id }));
}

export async function importLocation(
	locationToImport: LocationSchema,
	batch?: WriteBatch
): Promise<void> {
	const { allTransactions, updateTransaction } = await import("./transactionsStore");

	const storedLocation = get(locations)[locationToImport.id] ?? null;
	if (storedLocation) {
		// If duplicate, overwrite the one we have
		const newLocation = location({ ...storedLocation, ...locationToImport });
		await updateLocation(newLocation, batch);
	} else {
		// If new, create a new location
		const params: LocationRecordParams = {
			lastUsed: locationToImport.lastUsed,
			coordinate: locationToImport.coordinate ?? null,
			title: locationToImport.title.trim(),
			subtitle: locationToImport.subtitle?.trim() ?? null,
		};
		const newLocation = await createLocation(params, batch);

		// Update transactions with new location ID
		const matchingTransactions = get(allTransactions).filter(
			t => t.locationId === locationToImport.id
		);
		for (const txns of chunk(matchingTransactions, 500)) {
			const uBatch = writeBatch();
			await Promise.all(
				txns.map(t => {
					const newTxn = transaction(t);
					newTxn.locationId = newLocation.id;
					return updateTransaction(newTxn, uBatch);
				})
			);
			await uBatch.commit();
		}

		await updateUserStats();
	}
}

export async function importLocations(data: Array<LocationSchema>): Promise<void> {
	const { getAllTransactions } = await import("./transactionsStore");
	// Assume we've imported all transactions,
	// but don't assume we have them cached yet
	await getAllTransactions();
	await getAllLocations();

	// Only batch 250 at a time, since each import does up to 2 writes
	for (const locations of chunk(data, 250)) {
		const batch = writeBatch();
		await Promise.all(locations.map(l => importLocation(l, batch)));
		await batch.commit();
	}
}
