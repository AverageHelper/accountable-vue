import type { CollectionReference, DocumentReference } from "./references.js";
import type { AnyDataItem } from "./schemas.js";
import { isDataItem, isKeys } from "./schemas.js";
import {
	deleteDbCollection,
	deleteDbDoc,
	fetchDbCollection,
	fetchDbDoc,
	upsertDbDoc,
} from "./mongo.js";

// Since all data is encrypted, we only need to bother
// about persistent I/O. We leave path-level access-
// guarding to the Express frontend.

export type Unsubscribe = () => void;

type SDataChangeCallback = (newData: AnyDataItem | null) => void;
type PDataChangeCallback = (newData: Array<AnyDataItem>) => void;

interface _Watcher {
	plurality: "single" | "plural";
	id: string;
	onChange: SDataChangeCallback | PDataChangeCallback;
}

interface DocumentWatcher extends _Watcher {
	plurality: "single";
	collectionId: string;
	onChange: SDataChangeCallback;
}

interface CollectionWatcher extends _Watcher {
	plurality: "plural";
	onChange: PDataChangeCallback;
}

const documentWatchers = new Map<string, DocumentWatcher>();
const collectionWatchers = new Map<string, CollectionWatcher>();

export function watchUpdatesToDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>,
	onChange: SDataChangeCallback
): Unsubscribe {
	const handle: DocumentWatcher = {
		id: ref.id,
		collectionId: ref.parent.id,
		onChange,
		plurality: "single",
	};
	documentWatchers.set(handle.id, handle);

	// Send all data at path
	/* eslint-disable promise/prefer-await-to-then */
	void getDocument<T>(ref)
		.then(async data => {
			if (data) {
				await informWatchersForDocument(ref, data);
			}
		})
		.catch((error: unknown) => {
			console.error(error);
		});
	/* eslint-enable promise/prefer-await-to-then */

	return (): void => {
		documentWatchers.delete(handle.id);
	};
}

export function watchUpdatesToCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>,
	onChange: PDataChangeCallback
): Unsubscribe {
	const handle: CollectionWatcher = { id: ref.id, onChange, plurality: "plural" };
	collectionWatchers.set(handle.id, handle);

	// Send "added" for all data at path
	/* eslint-disable promise/prefer-await-to-then */
	void getCollection<T>(ref)
		.then(async data => {
			await informWatchersForCollection(ref, data);
		})
		.catch((error: unknown) => {
			console.error(error);
		});
	/* eslint-enable promise/prefer-await-to-then */

	return (): void => {
		collectionWatchers.delete(handle.id);
	};
}

async function informWatchersForDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>,
	newItem: AnyDataItem | null
): Promise<void> {
	const listeners = [...documentWatchers.values()].filter(
		w => w.id === ref.id && w.collectionId === ref.parent.id
	);
	await Promise.all(listeners.map(l => l.onChange(newItem)));
}

async function informWatchersForCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>,
	newItems: Array<AnyDataItem>
): Promise<void> {
	const listeners = [...collectionWatchers.values()].filter(w => w.id === ref.id);
	await Promise.all(listeners.map(l => l.onChange(newItems)));
}

export async function getDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<T | null> {
	const anything = await fetchDbDoc(ref);
	if (!isDataItem(anything) && !isKeys(anything)) return null;
	return anything;
}

export async function getCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<Array<T>> {
	return await fetchDbCollection(ref);
}

export async function deleteDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<void> {
	// Fetch the data
	const oldData = await getDocument<T>(ref);

	await deleteDbDoc(ref);

	// Tell listeners what happened
	if (oldData) {
		// Only call listeners about deletion if it wasn't gone in the first place
		await informWatchersForDocument(ref, null);
	}
}

export async function deleteCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<void> {
	await deleteDbCollection(ref);

	// Tell listeners what happened
	await informWatchersForCollection(ref, []);
}

export async function setDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>,
	newData: T
): Promise<void> {
	await upsertDbDoc(ref, newData);

	// Tell listeners what happened
	await informWatchersForDocument(ref, newData);
}

export * from "./references.js";
export * from "./schemas.js";
