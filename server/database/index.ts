import type { CollectionReference, DocumentReference } from "./references.js";
import type { AnyDataItem, IdentifiedDataItem } from "./schemas.js";
import {
	deleteDbCollection,
	deleteDbDoc,
	fetchDbCollection,
	fetchDbDoc,
	upsertDbDoc,
} from "./io.js";

// Since all data is encrypted on the client, we only
// need to bother about persistent I/O. We leave path-
// level access-guarding to the Express frontend.

export type Unsubscribe = () => void;

type SDataChangeCallback = (newData: IdentifiedDataItem | null) => void;
type PDataChangeCallback = (newData: Array<IdentifiedDataItem>) => void;

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

export function watchUpdatesToDocument(
	ref: DocumentReference<AnyDataItem>,
	onChange: SDataChangeCallback
): Unsubscribe {
	console.debug(`Watching updates to document at ${ref.path}`);
	const handle: DocumentWatcher = {
		id: ref.id,
		collectionId: ref.parent.id,
		onChange,
		plurality: "single",
	};
	documentWatchers.set(handle.id, handle);

	// Send all data at path
	/* eslint-disable promise/prefer-await-to-then */
	void fetchDbDoc(ref)
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
		console.debug(`Removing listener ${handle.id} for document ${ref.path}`);
		documentWatchers.delete(handle.id);
	};
}

export function watchUpdatesToCollection(
	ref: CollectionReference<AnyDataItem>,
	onChange: PDataChangeCallback
): Unsubscribe {
	const handle: CollectionWatcher = { id: ref.id, onChange, plurality: "plural" };
	collectionWatchers.set(handle.id, handle);

	// Send "added" for all data at path
	/* eslint-disable promise/prefer-await-to-then */
	void fetchDbCollection(ref)
		.then(async data => {
			await informWatchersForCollection(ref, data);
		})
		.catch((error: unknown) => {
			console.error(error);
		});
	/* eslint-enable promise/prefer-await-to-then */

	return (): void => {
		console.debug(`Removing listener ${handle.id} for collection ${ref.path}`);
		collectionWatchers.delete(handle.id);
	};
}

async function informWatchersForDocument(
	ref: DocumentReference<AnyDataItem>,
	newItem: IdentifiedDataItem | null
): Promise<void> {
	const docListeners = [...documentWatchers.values()].filter(
		w => w.id === ref.id && w.collectionId === ref.parent.id
	);
	const collectionListeners = [...collectionWatchers.values()].filter(w => w.id === ref.parent.id);
	console.debug(
		`Informing ${
			docListeners.length + collectionListeners.length
		} listeners about changes to document ${ref.path}`
	);
	await Promise.all(docListeners.map(l => l.onChange(newItem)));
	if (collectionListeners.length > 0) {
		const newCollection = await fetchDbCollection(ref.parent);
		await Promise.all(collectionListeners.map(l => l.onChange(newCollection)));
	}
}

async function informWatchersForCollection(
	ref: CollectionReference<AnyDataItem>,
	newItems: Array<IdentifiedDataItem>
): Promise<void> {
	const listeners = [...collectionWatchers.values()].filter(w => w.id === ref.id);
	console.debug(`Informing ${listeners.length} listeners about changes to collection ${ref.path}`);
	await Promise.all(listeners.map(l => l.onChange(newItems)));
}

export async function deleteDocument(ref: DocumentReference<AnyDataItem>): Promise<void> {
	// Fetch the data
	const oldData = await fetchDbDoc(ref);

	await deleteDbDoc(ref);

	// Tell listeners what happened
	if (oldData) {
		// Only call listeners about deletion if it wasn't gone in the first place
		await informWatchersForDocument(ref, null);
	}
}

export async function deleteCollection(ref: CollectionReference<AnyDataItem>): Promise<void> {
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
	let identifiedData: IdentifiedDataItem;
	if ("uid" in newData) {
		identifiedData = newData;
	} else {
		identifiedData = { ...newData, _id: ref.id };
	}
	await informWatchersForDocument(ref, identifiedData);
}

export * from "./references.js";
export * from "./schemas.js";

export { fetchDbDoc as getDocument };
export { fetchDbCollection as getCollection };
