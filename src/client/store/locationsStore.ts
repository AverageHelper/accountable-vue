import type { Location, LocationRecordParams } from "../model/Location";
import type { HashStore, WriteBatch } from "../transport";
import type { LocationSchema } from "../model/DatabaseSchema";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
import { getDocs } from "firebase/firestore";
import { stores } from "./stores";
import { useAuthStore } from "./authStore";
import chunk from "lodash/chunk";
import {
	createLocation,
	deriveDEK,
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
			console.log("locationsStore: cache cleared");
		},
		watchLocations(force: boolean = false) {
			if (this.locationsWatcher && !force) return;

			if (this.locationsWatcher) {
				this.locationsWatcher();
				this.locationsWatcher = null;
			}

			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const collection = locationsCollection(uid);
			this.locationsWatcher = watchAllRecords(
				collection,
				async snap => {
					this.loadError = null;
					const authStore = useAuthStore();
					const { dekMaterial } = await authStore.getDekMaterial();
					const dek = deriveDEK(pKey, dekMaterial);

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
				}
			);
		},
		async createLocation(record: LocationRecordParams, batch?: WriteBatch): Promise<Location> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

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

			return extantLocation ?? (await createLocation(uid, record, dek, batch));
		},
		async updateLocation(location: Location, batch?: WriteBatch): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateLocation(uid, location, dek, batch);
		},
		async deleteAllLocation(): Promise<void> {
			for (const locations of chunk(this.allLocations, 500)) {
				const batch = writeBatch();
				locations.forEach(l => void this.deleteLocation(l, batch));
				await batch.commit();
			}
		},
		async deleteLocation(location: Location, batch?: WriteBatch): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			// Transaction views should gracefully handle the
			// case where their linked location does not exist

			await deleteLocation(uid, location, batch);
		},
		async getAllLocations(): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = locationsCollection(uid);
			const snap = await getDocs(collection);
			snap.docs
				.map(doc => locationFromSnapshot(doc, dek))
				.forEach(l => {
					this.items[l.id] = l;
				});
		},
		async getAllLocationsAsJson(): Promise<Array<LocationSchema>> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = locationsCollection(uid);
			const snap = await getDocs(collection);
			return snap.docs
				.map(doc => locationFromSnapshot(doc, dek))
				.map(t => ({
					id: t.id,
					...t.toRecord(),
				}));
		},
		async importLocation(locationToImport: LocationSchema, batch?: WriteBatch): Promise<void> {
			const { transactions } = await stores();

			const storedLocation = this.items[locationToImport.id] ?? null;
			if (storedLocation) {
				// If duplicate, overwrite the one we have
				const newLocation = storedLocation.updatedWith(locationToImport);
				await this.updateLocation(newLocation, batch);
			} else {
				// If new, create a new location
				const params: LocationRecordParams = {
					coordinate: null,
					...locationToImport,
					title: locationToImport.title.trim(),
					subtitle: locationToImport.subtitle?.trim() ?? null,
				};
				const newLocation = await this.createLocation(params, batch);
				for (const transaction of transactions.allTransactions) {
					if (transaction.locationId !== locationToImport.id) continue;

					// Update the transaction with new location ID
					await transactions.updateTransaction(
						transaction.updatedWith({ locationId: newLocation.id }),
						batch
					);
				}
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
				locations.forEach(l => void this.importLocation(l, batch));
				await batch.commit();
			}
		},
	},
});
