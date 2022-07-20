import type { Tag, TagRecordParams } from "../model/Tag";
import type { TagRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { TagSchema } from "../model/DatabaseSchema";
import { derived, get, writable } from "svelte/store";
import { getDekMaterial, pKey } from "./authStore";
import { recordFromTag, tag } from "../model/Tag";
import { updateUserStats } from "./uiStore";
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

export const tags = writable<Record<string, Tag>>({}); // Tag.id -> Tag
export const tagsLoadError = writable<Error | null>(null);
export const tagsWatcher = writable<Unsubscribe | null>(null);

export const allTags = derived(tags, $tags => {
	return Object.values($tags);
});

export function clearTagsCache(): void {
	const watcher = get(tagsWatcher);
	if (watcher) {
		watcher();
		tagsWatcher.set(null);
	}
	tags.set({});
	tagsLoadError.set(null);
	console.debug("tagsStore: cache cleared");
}

export async function watchTags(force: boolean = false): Promise<void> {
	const watcher = get(tagsWatcher);
	if (watcher && !force) return;

	if (watcher) {
		watcher();
		tagsWatcher.set(null);
	}

	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = tagsCollection();
	tagsLoadError.set(null);
	tagsWatcher.set(
		watchAllRecords(
			collection,
			snap => {
				snap.docChanges().forEach(change => {
					switch (change.type) {
						case "removed":
							tags.update(tags => {
								const copy = { ...tags };
								delete copy[change.doc.id];
								return copy;
							});
							break;

						case "added":
						case "modified":
							tags.update(tags => {
								const copy = { ...tags };
								copy[change.doc.id] = tagFromSnapshot(change.doc, dek);
								return copy;
							});
							break;
					}
				});
			},
			error => {
				tagsLoadError.set(error);
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
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key");

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	const newTag = await _createTag(record, dek, batch);
	tags.update(tags => {
		const copy = { ...tags };
		copy[newTag.id] = newTag;
		return copy;
	});
	if (!batch) await updateUserStats();
	return newTag;
}

export async function updateTag(tag: Tag, batch?: WriteBatch): Promise<void> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	await _updateTag(tag, dek, batch);
	tags.update(tags => {
		const copy = { ...tags };
		copy[tag.id] = tag;
		return copy;
	});
	if (!batch) await updateUserStats();
}

export async function deleteTag(tag: Tag, batch?: WriteBatch): Promise<void> {
	await _deleteTag(tag, batch);
	tags.update(tags => {
		const copy = { ...tags };
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
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = tagsCollection();
	const snap = await getDocs<TagRecordPackage>(collection);
	return snap.docs
		.map(doc => tagFromSnapshot(doc, dek))
		.map(t => ({ ...recordFromTag(t), id: t.id }));
}

export async function importTag(tagToImport: TagSchema, batch?: WriteBatch): Promise<void> {
	const { allTransactions, updateTransaction } = await import("./transactionsStore");

	const storedTag = get(tags)[tagToImport.id] ?? null;
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
