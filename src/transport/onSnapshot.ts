import type { DocumentData, DocumentReference, Query } from "./db";

export class DocumentSnapshot<T = DocumentData> {
	#data: T | null;

	/**
	 * The `DocumentReference` for the document included in the `DocumentSnapshot`.
	 */
	public readonly ref: DocumentReference<T>;

	constructor(ref: DocumentReference<T>, data: T | null) {
		this.#data = data;
		this.ref = ref;
	}

	/**
	 * Property of the `DocumentSnapshot` that provides the document's ID.
	 */
	get id(): string {
		return this.ref.id;
	}

	/**
	 * Property of the `DocumentSnapshot` that signals whether or not the data
	 * exists. True if the document exists.
	 */
	exists(): this is QueryDocumentSnapshot<T> {
		return this.#data !== null;
	}

	/**
	 * Retrieves all fields in the document as an `Object`. Returns `undefined` if
	 * the document doesn't exist.
	 *
	 * @returns An `Object` containing all fields in the document or `undefined` if
	 * the document doesn't exist.
	 */
	data(): T | undefined {
		return this.#data ?? undefined;
	}

	toString(): string {
		return JSON.stringify({
			ref: this.ref.path,
			id: this.id,
		});
	}
}

export class QueryDocumentSnapshot<T> extends DocumentSnapshot<T> {
	/**
	 * Retrieves all fields in the document as an `Object`.
	 *
	 * @override
	 * @returns An `Object` containing all fields in the document.
	 */
	data(): T {
		const result = super.data();
		if (result === undefined)
			throw new TypeError(`Data at ref ${this.ref.path} is meant to exist but does not.`);
		return result;
	}
}

export type DocumentChangeType = "added" | "removed" | "modified";

export interface DocumentChange<T> {
	/** The type of change ('added', 'modified', or 'removed'). */
	readonly type: DocumentChangeType;

	/** The document affected by this change. */
	readonly doc: QueryDocumentSnapshot<T>;

	/**
	 * The index of the changed document in the result set immediately prior to
	 * this `DocumentChange` (i.e. supposing that all prior `DocumentChange` objects
	 * have been applied). Is `-1` for 'added' events.
	 */
	readonly oldIndex: number;

	/**
	 * The index of the changed document in the result set immediately after
	 * this `DocumentChange` (i.e. supposing that all prior `DocumentChange`
	 * objects and the current `DocumentChange` object have been applied).
	 * Is -1 for 'removed' events.
	 */
	readonly newIndex: number;
}

export class QuerySnapshot<T> {
	#previousSnapshot: QuerySnapshot<T> | null;

	/** An array of all the documents in the `QuerySnapshot`. */
	public readonly docs: ReadonlyArray<QueryDocumentSnapshot<T>>;

	/**
	 * The query on which you called `get` or `onSnapshot` in order to get this
	 * `QuerySnapshot`.
	 */
	public readonly query: Query<T>;

	/**
	 * @param prev The previous query snapshot, used for generating the result of the `docChanges` method.
	 * @param docs The documents in the snapshot.
	 */
	constructor(prev: QuerySnapshot<T>, docs: Array<QueryDocumentSnapshot<T>>);

	/**
	 * @param query The query used to generate the snapshot.
	 * @param docs The documents in the snapshot.
	 */
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	constructor(query: Query<T>, docs: Array<QueryDocumentSnapshot<T>>);

	constructor(queryOrPrev: Query<T> | QuerySnapshot<T>, docs: Array<QueryDocumentSnapshot<T>>) {
		if ("type" in queryOrPrev) {
			this.#previousSnapshot = null;
			this.query = queryOrPrev;
		} else {
			this.#previousSnapshot = queryOrPrev;
			this.query = queryOrPrev.query;
		}
		this.docs = docs;
	}

	/** The number of documents in the `QuerySnapshot`. */
	get size(): number {
		return this.docs.length;
	}

	/** True if there are no documents in the `QuerySnapshot`. */
	get empty(): boolean {
		return this.size === 0;
	}

	/**
	 * Enumerates all of the documents in the `QuerySnapshot`.
	 *
	 * @param callback - A callback to be called with a `QueryDocumentSnapshot` for
	 * each document in the snapshot.
	 * @param thisArg - The `this` binding for the callback.
	 */
	forEach(callback: (result: QueryDocumentSnapshot<T>) => void, thisArg?: unknown): void {
		this.docs.forEach(callback, thisArg);
	}

	/**
	 * Returns an array of the documents changes since the last snapshot. If this
	 * is the first snapshot, all documents will be in the list as 'added'
	 * changes.
	 */
	docChanges(): Array<DocumentChange<T>> {
		const prev = this.#previousSnapshot;

		if (!prev) {
			// add all as "added" changes
			return this.docs.map((doc, newIndex) => ({
				type: "added",
				doc,
				oldIndex: -1,
				newIndex,
			}));
		}

		// diff the snapshots from `prev`
		const result: Array<DocumentChange<T>> = this.docs.map((doc, newIndex) => {
			const oldIndex = prev.docs.findIndex(d => d.id === doc.id);
			if (oldIndex === -1) {
				return { type: "added", doc, oldIndex, newIndex };
			}
			// TODO: Handle the case where the data is unchanged
			return { type: "modified", doc, oldIndex, newIndex };
		});

		// add documents that were removed since `prev`
		const removedDocs: Array<DocumentChange<T>> = prev.docs
			.map<DocumentChange<T>>((doc, oldIndex) => {
				const newIndex = this.docs.findIndex(d => d.id === doc.id);
				if (newIndex === -1) {
					return { type: "removed", doc, oldIndex, newIndex };
				}
				// TODO: Handle the case where the data is unchanged
				return { type: "modified", doc, oldIndex, newIndex };
			})
			.filter(change => change.type === "removed");
		result.push(...removedDocs);

		return result;
	}

	toString(): string {
		return JSON.stringify({
			previousSnapshot: this.#previousSnapshot ? "<value>" : null,
			docs: `<${this.docs.length} docs>`,
			size: this.size,
			query: JSON.parse(this.query.toString()) as unknown,
		});
	}
}

export type Unsubscribe = () => void;

export type DocumentSnapshotCallback<T> = (snapshot: DocumentSnapshot<T>) => void;

export interface DocumentSnapshotObserver<T> {
	next?: DocumentSnapshotCallback<T>;
	error?: (error: Error) => void;
}

export type QuerySnapshotCallback<T> = (snapshot: QuerySnapshot<T>) => void;

export interface QuerySnapshotObserver<T> {
	next?: QuerySnapshotCallback<T>;
	error?: (error: Error) => void;
}

/**
 * Attaches a listener for `DocumentSnapshot` events. You may either pass
 * individual `onNext` and `onError` callbacks or pass a single observer
 * object with `next` and `error` callbacks.
 *
 * @param reference - A reference to the document to listen to.
 * @param observer - A single object containing `next` and `error` callbacks.
 * @returns An unsubscribe function that can be called to cancel
 * the snapshot listener.
 */
export function onSnapshot<T>(
	reference: DocumentReference<T>,
	observer: DocumentSnapshotObserver<T>
): Unsubscribe;

/**
 * Attaches a listener for `DocumentSnapshot` events. You may either pass
 * individual `onNext` and `onError` callbacks or pass a single observer
 * object with `next` and `error` callbacks.
 *
 * @param reference - A reference to the document to listen to.
 * @param onNext - A callback to be called every time a new `DocumentSnapshot`
 * is available.
 * @param onError - A callback to be called if the listen fails or is
 * cancelled. No further callbacks will occur.
 * @returns An unsubscribe function that can be called to cancel
 * the snapshot listener.
 */
export function onSnapshot<T>(
	reference: DocumentReference<T>,
	onNext: DocumentSnapshotCallback<T>,
	onError?: (error: Error) => void
): Unsubscribe;

/**
 * Attaches a listener for `QuerySnapshot` events. You may either pass
 * individual `onNext` and `onError` callbacks or pass a single observer
 * object with `next` and `error` callbacks. The listener can be cancelled by
 * calling the function that is returned when `onSnapshot` is called.
 *
 * @param query - The query to listen to.
 * @param observer - A single object containing `next` and `error` callbacks.
 * @returns An unsubscribe function that can be called to cancel
 * the snapshot listener.
 */
export function onSnapshot<T>(query: Query<T>, observer: QuerySnapshotObserver<T>): Unsubscribe;

/**
 * Attaches a listener for `QuerySnapshot` events. You may either pass
 * individual `onNext` and `onError` callbacks or pass a single observer
 * object with `next` and `error` callbacks. The listener can be cancelled by
 * calling the function that is returned when `onSnapshot` is called.
 *
 * @param query - The query to listen to.
 * @param onNext - A callback to be called every time a new `QuerySnapshot`
 * is available.
 * @param onError - A callback to be called if the listen fails or is
 * cancelled. No further callbacks will occur.
 * @returns An unsubscribe function that can be called to cancel
 * the snapshot listener.
 */
export function onSnapshot<T>(
	query: Query<T>,
	onNext: QuerySnapshotCallback<T>,
	onError?: (error: Error) => void
): Unsubscribe;

export function onSnapshot<T>(
	queryOrReference: Query<T> | DocumentReference<T>,
	onNextOrObserver:
		| QuerySnapshotCallback<T>
		| DocumentSnapshotCallback<T>
		| QuerySnapshotObserver<T>
		| DocumentSnapshotObserver<T>,
	onError?: (error: Error) => void
): Unsubscribe {
	const type = queryOrReference.type;
	let onNextCallback: QuerySnapshotCallback<T> | DocumentSnapshotCallback<T>;
	let onErrorCallback: (error: Error) => void;

	// Grab callback functions
	if (typeof onNextOrObserver === "object") {
		onNextCallback = onNextOrObserver.next ?? ((): void => undefined);
		onErrorCallback = onNextOrObserver.error ?? onError ?? ((): void => undefined);
	} else {
		onNextCallback = onNextOrObserver;
		onErrorCallback = onError ?? ((): void => undefined);
	}

	// TODO: Start a websocket and plug callbacks in appropriately

	return (): void => {
		// TODO: Shut off the websocket
	};
}