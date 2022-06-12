import type { Tag, TagRecordParams } from "../model/Tag";
import type { HashStore, TagRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { TagSchema } from "../model/DatabaseSchema";
import { defineStore } from "pinia";
import { stores } from "./stores";
import { useAuthStore } from "./authStore";
import { useUiStore } from "./uiStore";
import chunk from "lodash/chunk";
import {
	createTag,
	deriveDEK,
	updateTag,
	deleteTag,
	getDocs,
	tagFromSnapshot,
	tagsCollection,
	watchAllRecords,
	writeBatch,
} from "../transport";

export const useTagsStore = defineStore("tags", {
	state: () => ({
		items: {} as Dictionary<Tag>, // Tag.id -> Tag
		loadError: null as Error | null,
		tagsWatcher: null as Unsubscribe | null,
	}),
	getters: {
		allTags(state): Array<Tag> {
			return Object.values(state.items);
		},
	},
	actions: {
		clearCache() {
			if (this.tagsWatcher) {
				this.tagsWatcher();
				this.tagsWatcher = null;
			}
			this.items = {};
			this.loadError = null;
			console.debug("tagsStore: cache cleared");
		},
		async watchTags(force: boolean = false) {
			if (this.tagsWatcher && !force) return;

			if (this.tagsWatcher) {
				this.tagsWatcher();
				this.tagsWatcher = null;
			}

			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N
			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = tagsCollection();
			this.loadError = null;
			this.tagsWatcher = watchAllRecords(
				collection,
				snap => {
					snap.docChanges().forEach(change => {
						switch (change.type) {
							case "removed":
								delete this.items[change.doc.id];
								break;

							case "added":
							case "modified":
								this.items[change.doc.id] = tagFromSnapshot(change.doc, dek);
								break;
						}
					});
				},
				error => {
					this.loadError = error;
					if (this.tagsWatcher) this.tagsWatcher();
					this.tagsWatcher = null;
					console.error(error);
				}
			);
		},
		async createTag(record: TagRecordParams, batch?: WriteBatch): Promise<Tag> {
			const uiStore = useUiStore();

			// If a tag already exists with this name, return that one instead
			const extantTag = this.allTags.find(tag => tag.name === record.name);
			if (extantTag) return extantTag;

			// Otherwise, go ahead and make one
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const newTag = await createTag(record, dek, batch);
			this.items[newTag.id] = newTag;
			if (!batch) await uiStore.updateUserStats();
			return newTag;
		},
		async updateTag(tag: Tag, batch?: WriteBatch): Promise<void> {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateTag(tag, dek, batch);
			this.items[tag.id] = tag;
			if (!batch) await uiStore.updateUserStats();
		},
		async deleteTag(tag: Tag, batch?: WriteBatch): Promise<void> {
			const uiStore = useUiStore();
			await deleteTag(tag, batch);
			delete this.items[tag.id];
			if (!batch) await uiStore.updateUserStats();
		},
		async deleteAllTags(): Promise<void> {
			for (const tags of chunk(this.allTags, 500)) {
				const batch = writeBatch();
				await Promise.all(tags.map(t => this.deleteTag(t, batch)));
				await batch.commit();
			}
		},
		async getAllTagsAsJson(): Promise<Array<TagSchema>> {
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = tagsCollection();
			const snap = await getDocs<TagRecordPackage>(collection);
			return snap.docs
				.map(doc => tagFromSnapshot(doc, dek))
				.map(t => ({ ...t.toRecord(), id: t.id }));
		},
		async importTag(tagToImport: TagSchema, batch?: WriteBatch): Promise<void> {
			const { transactions } = await stores();
			const uiStore = useUiStore();

			const storedTag = this.items[tagToImport.id] ?? null;
			if (storedTag) {
				// If duplicate, overwrite the one we have
				const newTag = storedTag.updatedWith(tagToImport);
				await this.updateTag(newTag, batch);
			} else {
				// If new, create a new tag
				const params: TagRecordParams = {
					colorId: tagToImport.colorId,
					name: tagToImport.name,
				};
				const newTag = await this.createTag(params, batch);

				// Update transactions with new tag ID
				const matchingTransactions = transactions.allTransactions.filter(t =>
					t.tagIds.includes(tagToImport.id)
				);
				for (const txns of chunk(matchingTransactions, 500)) {
					const uBatch = writeBatch();
					await Promise.all(
						txns.map(txn => {
							const t = txn.copy();
							t.removeTagId(tagToImport.id);
							t.addTagId(newTag.id);
							return transactions.updateTransaction(t, uBatch);
						})
					);
					await uBatch.commit();
				}
			}
			await uiStore.updateUserStats();
		},
		async importTags(data: Array<TagSchema>): Promise<void> {
			for (const tags of chunk(data, 500)) {
				const batch = writeBatch();
				await Promise.all(tags.map(t => this.importTag(t, batch)));
				await batch.commit();
			}
		},
	},
});
