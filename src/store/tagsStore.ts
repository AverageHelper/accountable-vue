import type { Tag, TagRecordParams } from "../model/Tag";
import type { HashStore, TagRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { TagSchema } from "../model/DatabaseSchema";
import { derived, get, writable } from "svelte/store";
import { recordFromTag, tag } from "../model/Tag";
import { updateUserStats } from "./uiStore";
import { useAuthStore } from "./authStore";
import chunk from "lodash/chunk";
import {
	addTagToTransaction,
	transaction as copy,
	removeTagFromTransaction,
} from "../model/Transaction";
import {
	createTag as _createTag,
	deriveDEK,
	updateTag as _updateTag,
	deleteTag as _deleteTag,
	getDocs,
	tagFromSnapshot,
	tagsCollection,
	watchAllRecords,
	writeBatch,
} from "../transport";

export const items = writable<Record<string, Tag>>({}); // Tag.id -> Tag
export const loadError = writable<Error | null>(null);
export const tagsWatcher = writable<Unsubscribe | null>(null);

export const allTags = derived(items, $items => {
	return Object.values($items);
});

export function clearTagsCache(): void {
	const watcher = get(tagsWatcher);
	if (watcher) {
		watcher();
		tagsWatcher.set(null);
	}
	items.set({});
	loadError.set(null);
	console.debug("tagsStore: cache cleared");
}

export async function watchTags(force: boolean = false): Promise<void> {
	const watcher = get(tagsWatcher);
	if (watcher && !force) return;

	if (watcher) {
		watcher();
		tagsWatcher.set(null);
	}

	const authStore = useAuthStore();
	const pKey = authStore.pKey as HashStore | null;
	if (pKey === null) throw new Error("No decryption key"); // TODO: I18N
	const { dekMaterial } = await authStore.getDekMaterial();
	const dek = deriveDEK(pKey, dekMaterial);

	const collection = tagsCollection();
	loadError.set(null);
	tagsWatcher.set(
		watchAllRecords(
			collection,
			snap => {
				snap.docChanges().forEach(change => {
					switch (change.type) {
						case "removed":
							items.update(items => {
								const copy = { ...items };
								delete copy[change.doc.id];
								return copy;
							});
							break;

						case "added":
						case "modified":
							items.update(items => {
								const copy = { ...items };
								copy[change.doc.id] = tagFromSnapshot(change.doc, dek);
								return copy;
							});
							break;
					}
				});
			},
			error => {
				loadError.set(error);
				const watcher = get(tagsWatcher);
				if (watcher) watcher();
				tagsWatcher.set(null);
				console.error(error);
			}
		)
	);
}

export async function createTag(record: TagRecordParams, batch?: WriteBatch): Promise<Tag> {
	// If a tag already exists with this name, return that one instead
	const extantTag = get(allTags).find(tag => tag.name === record.name);
	if (extantTag) return extantTag;

	// Otherwise, go ahead and make one
	const authStore = useAuthStore();
	const pKey = authStore.pKey as HashStore | null;
	if (pKey === null) throw new Error("No decryption key");

	const { dekMaterial } = await authStore.getDekMaterial();
	const dek = deriveDEK(pKey, dekMaterial);
	const newTag = await _createTag(record, dek, batch);
	items.update(items => {
		const copy = { ...items };
		copy[newTag.id] = newTag;
		return copy;
	});
	if (!batch) await updateUserStats();
	return newTag;
}

export async function updateTag(tag: Tag, batch?: WriteBatch): Promise<void> {
	const authStore = useAuthStore();
	const pKey = authStore.pKey as HashStore | null;
	if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await authStore.getDekMaterial();
	const dek = deriveDEK(pKey, dekMaterial);
	await _updateTag(tag, dek, batch);
	items.update(items => {
		const copy = { ...items };
		copy[tag.id] = tag;
		return copy;
	});
	if (!batch) await updateUserStats();
}

export async function deleteTag(tag: Tag, batch?: WriteBatch): Promise<void> {
	await _deleteTag(tag, batch);
	items.update(items => {
		const copy = { ...items };
		delete copy[tag.id];
		return copy;
	});
	if (!batch) await updateUserStats();
}

export async function deleteAllTags(): Promise<void> {
	for (const tags of chunk(get(allTags), 500)) {
		const batch = writeBatch();
		await Promise.all(tags.map(t => deleteTag(t, batch)));
		await batch.commit();
	}
}

export async function getAllTagsAsJson(): Promise<Array<TagSchema>> {
	const authStore = useAuthStore();
	const pKey = authStore.pKey as HashStore | null;
	if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await authStore.getDekMaterial();
	const dek = deriveDEK(pKey, dekMaterial);

	const collection = tagsCollection();
	const snap = await getDocs<TagRecordPackage>(collection);
	return snap.docs
		.map(doc => tagFromSnapshot(doc, dek))
		.map(t => ({ ...recordFromTag(t), id: t.id }));
}

export async function importTag(tagToImport: TagSchema, batch?: WriteBatch): Promise<void> {
	const { allTransactions, updateTransaction } = await import("./transactionsStore");

	const storedTag = get(items)[tagToImport.id] ?? null;
	if (storedTag) {
		// If duplicate, overwrite the one we have
		const newTag = tag({ ...storedTag, ...tagToImport });
		await updateTag(newTag, batch);
	} else {
		// If new, create a new tag
		const params: TagRecordParams = {
			colorId: tagToImport.colorId,
			name: tagToImport.name,
		};
		const newTag = await createTag(params, batch);

		// Update transactions with new tag ID
		const matchingTransactions = get(allTransactions).filter(t =>
			t.tagIds.includes(tagToImport.id)
		);
		for (const txns of chunk(matchingTransactions, 500)) {
			const uBatch = writeBatch();
			await Promise.all(
				txns.map(txn => {
					const t = copy(txn);
					removeTagFromTransaction(t, tag(tagToImport));
					addTagToTransaction(t, newTag);
					return updateTransaction(t, uBatch);
				})
			);
			await uBatch.commit();
		}
	}
	await updateUserStats();
}

export async function importTags(data: Array<TagSchema>): Promise<void> {
	for (const tags of chunk(data, 500)) {
		const batch = writeBatch();
		await Promise.all(tags.map(t => importTag(t, batch)));
		await batch.commit();
	}
}
