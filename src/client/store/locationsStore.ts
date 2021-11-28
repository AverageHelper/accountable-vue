import type { Location, LocationRecordParams } from "../model/Location";
import type { HashStore } from "../transport";
import type { LocationSchema } from "../model/DatabaseSchema";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
import { getDocs } from "firebase/firestore";
import { useAuthStore } from "./authStore";
import {
	createLocation,
	deriveDEK,
	updateLocation,
	deleteLocation,
	locationFromSnapshot,
	locationsCollection,
	watchAllRecords,
} from "../transport";

export type LocationsDownloadable = Array<LocationRecordParams & { id: string }>;

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
		async createLocation(record: LocationRecordParams): Promise<Location> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			return await createLocation(uid, record, dek);
		},
		async updateLocation(location: Location): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateLocation(uid, location, dek);
		},
		async deleteLocation(location: Location): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			// Transaction views should gracefully handle the
			// case where their linked location does not exist

			await deleteLocation(uid, location);
		},
		async getAllLocationsAsJson(): Promise<LocationsDownloadable> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = locationsCollection(uid);
			const snap = await getDocs(collection);
			const tags: LocationsDownloadable = snap.docs
				.map(doc => locationFromSnapshot(doc, dek))
				.map(t => ({
					id: t.id,
					...t.toRecord(),
				}));
			return tags;
		},
		async importLocation(locationToImport: LocationSchema): Promise<void> {
			const storedLocation = this.items[locationToImport.id] ?? null;
			if (storedLocation) {
				// If duplicate, overwrite the one we have
				const newLocation = storedLocation.updatedWith(locationToImport);
				await this.updateLocation(newLocation);
			} else {
				// If new, create a new location
				const params: LocationRecordParams = {
					coordinate: null,
					...locationToImport,
					title: locationToImport.title.trim(),
					subtitle: locationToImport.subtitle?.trim() ?? null,
				};
				await this.createLocation(params);
			}
		},
		async importLocations(data: Array<LocationSchema>): Promise<void> {
			for (const locationToImport of data) {
				await this.importLocation(locationToImport);
			}
		},
	},
});
