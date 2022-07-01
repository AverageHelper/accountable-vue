import type { Location, LocationRecordParams } from "../model/Location";
import type { HashStore, LocationRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { LocationSchema } from "../model/DatabaseSchema";
import { defineStore } from "pinia";
import { location, recordFromLocation } from "../model/Location";
import { newTransactionWithDelta } from "../model/Transaction";
import { stores } from "./stores";
import { useAuthStore } from "./authStore";
import { useUiStore } from "./uiStore";
import chunk from "lodash/chunk";
import {
	createLocation,
	deriveDEK,
	getDocs,
	updateLocation,
	deleteLocation,
	locationFromSnapshot,
	locationsCollection,
	watchAllRecords,
	writeBatch,
} from "../transport";

export const useLocationsStore = defineStore("locations", {
	state: () => ({
		items: {} as Dictionary<Location>, // Location.id -> Location
		loadError: null as Error | null,
		locationsWatcher: null as Unsubscribe | null,
	}),
	getters: {
		allLocations(state): Array<Location> {
			return Object.values(state.items);
		},
	},
	actions: {
		clearCache() {
			if (this.locationsWatcher) {
				this.locationsWatcher();
				this.locationsWatcher = null;
			}
			this.items = {};
			this.loadError = null;
			console.debug("locationsStore: cache cleared");
		},
		async watchLocations(force: boolean = false) {
			if (this.locationsWatcher && !force) return;

			if (this.locationsWatcher) {
				this.locationsWatcher();
				this.locationsWatcher = null;
			}

			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N
			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = locationsCollection();
			this.loadError = null;
			this.locationsWatcher = watchAllRecords(
				collection,
				snap => {
					snap.docChanges().forEach(change => {
						switch (change.type) {
							case "removed":
								delete this.items[change.doc.id];
								break;

							case "added":
							case "modified":
								this.items[change.doc.id] = locationFromSnapshot(change.doc, dek);
								break;
						}
					});
				},
				error => {
					this.loadError = error;
					if (this.locationsWatcher) this.locationsWatcher();
					this.locationsWatcher = null;
					console.error(error);
				}
			);
		},
		async createLocation(record: LocationRecordParams, batch?: WriteBatch): Promise<Location> {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N
			if (uid === null) throw new Error("Sign in first"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			// If the record matches the title and coords of an extant location, return that instead
			const extantLocation = record.coordinate
				? // coordinate matches
				  this.allLocations.find(
						l =>
							record.coordinate?.lat === l.coordinate?.lat &&
							record.coordinate?.lng === l.coordinate?.lng &&
							record.title === l.title
				  )
				: // title matches
				  this.allLocations.find(l => record.title === l.title && record.subtitle === l.subtitle);

			const newLocation = extantLocation ?? (await createLocation(uid, record, dek, batch));
			if (!batch) await uiStore.updateUserStats();

			this.items[newLocation.id] = newLocation;
			return newLocation;
		},
		async updateLocation(location: Location, batch?: WriteBatch): Promise<void> {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N
			if (uid === null) throw new Error("Sign in first"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateLocation(location, dek, batch);
			if (!batch) await uiStore.updateUserStats();
			this.items[location.id] = location;
		},
		async deleteAllLocation(): Promise<void> {
			for (const locations of chunk(this.allLocations, 500)) {
				const batch = writeBatch();
				await Promise.all(locations.map(l => this.deleteLocation(l, batch)));
				await batch.commit();
			}
		},
		async deleteLocation(location: Location, batch?: WriteBatch): Promise<void> {
			// Transaction views should gracefully handle the
			// case where their linked location does not exist

			const uiStore = useUiStore();
			await deleteLocation(location, batch);
			delete this.items[location.id];
			if (!batch) await uiStore.updateUserStats();
		},
		async getAllLocations(): Promise<void> {
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = locationsCollection();
			const snap = await getDocs<LocationRecordPackage>(collection);
			snap.docs
				.map(doc => locationFromSnapshot(doc, dek))
				.forEach(l => {
					this.items[l.id] = l;
				});
		},
		async getAllLocationsAsJson(): Promise<Array<LocationSchema>> {
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = locationsCollection();
			const snap = await getDocs<LocationRecordPackage>(collection);
			return snap.docs
				.map(doc => locationFromSnapshot(doc, dek))
				.map(t => ({ ...recordFromLocation(t), id: t.id }));
		},
		async importLocation(locationToImport: LocationSchema, batch?: WriteBatch): Promise<void> {
			const { transactions } = await stores();
			const uiStore = useUiStore();

			const storedLocation = this.items[locationToImport.id] ?? null;
			if (storedLocation) {
				// If duplicate, overwrite the one we have
				const newLocation = location({ ...storedLocation, ...locationToImport });
				await this.updateLocation(newLocation, batch);
			} else {
				// If new, create a new location
				const params: LocationRecordParams = {
					lastUsed: locationToImport.lastUsed,
					coordinate: locationToImport.coordinate ?? null,
					title: locationToImport.title.trim(),
					subtitle: locationToImport.subtitle?.trim() ?? null,
				};
				const newLocation = await this.createLocation(params, batch);

				// Update transactions with new location ID
				const matchingTransactions = transactions.allTransactions.filter(
					t => t.locationId === locationToImport.id
				);
				for (const txns of chunk(matchingTransactions, 500)) {
					const uBatch = writeBatch();
					await Promise.all(
						txns.map(t =>
							transactions.updateTransaction(
								newTransactionWithDelta(t, { locationId: newLocation.id }),
								uBatch
							)
						)
					);
					await uBatch.commit();
				}

				await uiStore.updateUserStats();
			}
		},
		async importLocations(data: Array<LocationSchema>): Promise<void> {
			const { transactions } = await stores();
			// Assume we've imported all transactions,
			// but don't assume we have them cached yet
			await transactions.getAllTransactions();
			await this.getAllLocations();

			// Only batch 250 at a time, since each import does up to 2 writes
			for (const locations of chunk(data, 250)) {
				const batch = writeBatch();
				await Promise.all(locations.map(l => this.importLocation(l, batch)));
				await batch.commit();
			}
		},
	},
});
