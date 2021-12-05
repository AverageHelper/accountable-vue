import { v4 as uuid } from "uuid";

// Since all data is encrypted, we only need to bother
// about where that data goes and comes from. We leave
// path-level security to Express.

export interface DataItem {
	[key: string]: unknown;
}

interface DataAdd {
	type: "added";
	oldData: null;
	newData: DataItem;
}

interface DataRemove {
	type: "removed";
	oldData: DataItem;
	newData: null;
}

interface DataModify {
	type: "modified";
	oldData: DataItem;
	newData: DataItem;
}

type DataChange = DataAdd | DataRemove | DataModify;

type DataChangeCallback = (change: DataChange) => void;

interface WatcherHandle {
	id: string;
	path: string;
	onChange: DataChangeCallback;
}

const watcherHandles = new Map<string, WatcherHandle>();

export function watchUpdatesToDocumentAtPath(
	path: string,
	onChange: DataChangeCallback
): WatcherHandle {
	const handle: WatcherHandle = { id: uuid(), path, onChange };
	watcherHandles.set(handle.id, handle);

	// TODO: Send "added" for all data at path

	return handle;
}

export function stopWatchingUpdates(handle: WatcherHandle): void {
	watcherHandles.delete(handle.id);
}

async function informWatchersForPath(path: string, change: DataChange): Promise<void> {
	const listeners = [...watcherHandles.values()].filter(w => w.path === path);
	await Promise.all(listeners.map(l => l.onChange(change)));
}

export async function getDataItemAtPath(path: string): Promise<DataItem | null> {
	// Fetch the data
	return null;
}

export async function deleteDataItemAtPath(path: string): Promise<void> {
	// Fetch the data
	const oldData = await getDataItemAtPath(path);

	// Remove the data

	// Tell listeners what happened
	if (oldData) {
		// Only call listeners about deletion if it wasn't gone in the first place
		const change: DataRemove = {
			type: "removed",
			oldData,
			newData: null,
		};
		await informWatchersForPath(path, change);
	}
}

export async function setDataItemAtPath(path: string, newData: DataItem): Promise<void> {
	// Fetch the data
	const oldData = await getDataItemAtPath(path);

	// Upsert the data

	// Tell listeners what happened
	let change: DataAdd | DataModify;
	if (oldData === null) {
		change = { type: "added", oldData, newData };
	} else {
		change = { type: "modified", oldData, newData };
	}
	await informWatchersForPath(path, change);
}
