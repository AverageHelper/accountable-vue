import type { CollectionReference, DocumentReference } from "./references.js";
import type { AnyDataItem } from "./schemas.js";
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
	newData: AnyDataItem;
}

interface DataRemove {
	id: string;
	type: "removed";
	oldData: AnyDataItem;
	newData: null;
}

interface DataModify {
	id: string;
	type: "modified";
	oldData: AnyDataItem;
	newData: AnyDataItem;
}

type DataChange = DataAdd | DataRemove | DataModify;
type DataChanges = NonEmptyArray<DataChange>;
type Unsubscribe = () => void;

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

	// Send "added" for all data at path
	/* eslint-disable promise/prefer-await-to-then */
	void getDocument<T>(ref)
		.then(async data => {
			if (data) {
				const change: DataAdd = {
					id: ref.id,
					type: "added",
					oldData: null,
					newData: data,
				};
				await informWatchersForDocument(ref, change);
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
			const changes: Array<DataAdd> = data.map<DataAdd>(newData => ({
				id: newData._id,
				type: "added",
				oldData: null,
				newData,
			}));
			if (changes.length > 0) {
				await informWatchersForCollection(ref, changes as DataChanges);
			}
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
	change: DataChange
): Promise<void> {
	const listeners = [...documentWatchers.values()].filter(
		w => w.id === ref.id && w.collectionId === ref.parent.id
	);
	await Promise.all(listeners.map(l => l.onChange(change)));
}

async function informWatchersForCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>,
	changes: DataChanges
): Promise<void> {
	const listeners = [...collectionWatchers.values()].filter(w => w.id === ref.id);
	await Promise.all(listeners.map(l => l.onChange(changes)));
}

export async function getDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<T | null> {
	const anything = await fetchDbDoc(ref);
	if (!anything || !isDataItem(anything)) return null;
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
		const change: DataRemove = {
			id: ref.id,
			type: "removed",
			oldData,
			newData: null,
		};
		await informWatchersForDocument(ref, change);
	}
}

export async function deleteCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<void> {
	// Fetch the data
	const oldData = await getCollection<T>(ref);

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

export async function setDocument<T extends AnyDataItem>(
	ref: DocumentReference<T>,
	newData: T
): Promise<void> {
	// Fetch the data
	const oldData = await getDocument<T>(ref);

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
export * from "./schemas.js";
