import type { CollectionReference, DocumentReference } from "./references.js";
import type { DataItem } from "./schemas.js";
import { isDataItem } from "./schemas.js";
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

interface DataAdd {
	id: string;
	type: "added";
	oldData: null;
	newData: DataItem;
}

interface DataRemove {
	id: string;
	type: "removed";
	oldData: DataItem;
	newData: null;
}

interface DataModify {
	id: string;
	type: "modified";
	oldData: DataItem;
	newData: DataItem;
}

type DataChange = DataAdd | DataRemove | DataModify;
type DataChanges = NonEmptyArray<DataChange>;

type SDataChangeCallback = (change: DataChange) => void;
type PDataChangeCallback = (change: DataChanges) => void;

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

export async function watchUpdatesToDocument(
	ref: DocumentReference,
	onChange: SDataChangeCallback
): Promise<DocumentWatcher> {
	const handle: DocumentWatcher = {
		id: ref.id,
		collectionId: ref.parent.id,
		onChange,
		plurality: "single",
	};
	documentWatchers.set(handle.id, handle);

	// Send "added" for all data at path
	const data = await getDocument(ref);
	if (data) {
		const change: DataAdd = {
			id: ref.id,
			type: "added",
			oldData: null,
			newData: data,
		};
		await informWatchersForDocument(ref, change);
	}

	return handle;
}

export async function watchUpdatesToCollection(
	ref: CollectionReference,
	onChange: PDataChangeCallback
): Promise<CollectionWatcher> {
	const handle: CollectionWatcher = { id: ref.id, onChange, plurality: "plural" };
	collectionWatchers.set(handle.id, handle);

	// Send "added" for all data at path
	const data = await getCollection(ref);
	const changes: Array<DataAdd> = data.map<DataAdd>(newData => ({
		id: newData._id,
		type: "added",
		oldData: null,
		newData,
	}));
	if (changes.length > 0) {
		await informWatchersForCollection(ref, changes as DataChanges);
	}

	return handle;
}

export function stopWatchingUpdates(handle: DocumentWatcher | CollectionWatcher): void {
	const isSingle = handle.plurality === "single";
	const watchers = isSingle ? documentWatchers : collectionWatchers;
	watchers.delete(handle.id);
}

async function informWatchersForDocument(
	ref: DocumentReference,
	change: DataChange
): Promise<void> {
	const listeners = [...documentWatchers.values()].filter(
		w => w.id === ref.id && w.collectionId === ref.parent.id
	);
	await Promise.all(listeners.map(l => l.onChange(change)));
}

async function informWatchersForCollection(
	ref: CollectionReference,
	changes: DataChanges
): Promise<void> {
	const listeners = [...collectionWatchers.values()].filter(w => w.id === ref.id);
	await Promise.all(listeners.map(l => l.onChange(changes)));
}

export async function getDocument(ref: DocumentReference): Promise<DataItem | null> {
	const anything = await fetchDbDoc(ref);
	if (!anything || !isDataItem(anything)) return null;
	return anything;
}

export async function getCollection(ref: CollectionReference): Promise<Array<DataItem>> {
	const anything = await fetchDbCollection(ref);
	return anything.filter(isDataItem);
}

export async function deleteDocument(ref: DocumentReference): Promise<void> {
	// Fetch the data
	const oldData = await getDocument(ref);

	await deleteDbDoc(ref);

	// Tell listeners what happened
	if (oldData) {
		// Only call listeners about deletion if it wasn't gone in the first place
		const change: DataRemove = {
			id: ref.id,
			type: "removed",
			oldData,
			newData: null,
		};
		await informWatchersForDocument(ref, change);
	}
}

export async function deleteCollection(ref: CollectionReference): Promise<void> {
	// Fetch the data
	const oldData = await getCollection(ref);

	await deleteDbCollection(ref);

	// Tell listeners what happened
	const changes: Array<DataRemove> = oldData.map<DataRemove>(oldData => ({
		id: oldData._id,
		type: "removed",
		oldData,
		newData: null,
	}));
	if (changes.length > 0) {
		await informWatchersForCollection(ref, changes as DataChanges);
	}
}

export async function setDocument(ref: DocumentReference, newData: DataItem): Promise<void> {
	// Fetch the data
	const oldData = await getDocument(ref);

	await upsertDbDoc(ref, newData);

	// Tell listeners what happened
	let change: DataAdd | DataModify;
	if (oldData === null) {
		change = { type: "added", oldData, newData, id: ref.id };
	} else {
		change = { type: "modified", oldData, newData, id: ref.id };
	}
	await informWatchersForDocument(ref, change);
}

export * from "./references.js";
export type { DataItem };
