import type { DocumentData, DocumentWriteBatch, PrimitiveRecord } from "./schemas.js";
import type { EPackage, HashStore } from "./cryption.js";
import type { Unsubscribe } from "./onSnapshot.js";
import type { User } from "./auth.js";
import type { ValueIteratorTypeGuard } from "lodash";
import { AccountableError } from "./errors/index.js";
import { decrypt } from "./cryption.js";
import { forgetJobQueue, useJobQueue } from "@averagehelper/job-queue";
import { isPrimitive } from "./schemas.js";
import { v4 as uuid } from "uuid";
import isArray from "lodash/isArray";
import isString from "lodash/isString";
import {
	databaseBatchWrite,
	databaseCollection,
	databaseDocument,
	deleteAt,
	getFrom,
	postTo,
} from "./api-types/index.js";
import {
	DocumentSnapshot,
	onSnapshot,
	QueryDocumentSnapshot,
	QuerySnapshot,
} from "./onSnapshot.js";

export class AccountableDB {
	#jwt: string | null;
	#currentUser: User | null;
	public readonly url: Readonly<URL>;

	constructor(url: string) {
		this.#jwt = null;
		this.#currentUser = null;
		this.url = new URL(url);
	}

	get jwt(): Readonly<string | null> {
		return this.#jwt;
	}

	get currentUser(): User | null {
		return this.#currentUser;
	}

	setJwt(jwt: string, user: User): void {
		if (!jwt) throw new TypeError("jwt cannot be empty");
		this.#jwt = jwt;
		this.#currentUser = user;
	}

	clearJwt(): void {
		this.#jwt = null;
		this.#currentUser = null;
	}

	toString(): string {
		return JSON.stringify({
			url: this.url,
			jwt: this.#jwt !== null ? "<value>" : null,
			currentUser: this.#currentUser ? "<signed in>" : null,
		});
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Query<T = DocumentData> {
	/** The type of this database reference. */
	public readonly type: "query" | "collection";

	/**
	 * The {@link AccountableDB} instance for the Accountable database (useful for performing
	 * transactions, etc.).
	 */
	public readonly db: AccountableDB;

	constructor(db: AccountableDB) {
		this.type = "query";
		this.db = db;
	}

	toString(): string {
		return JSON.stringify({
			type: this.type,
		});
	}
}

export type CollectionID =
	| "accounts"
	| "attachments"
	| "keys"
	| "locations"
	| "tags"
	| "transactions"
	| "users";

export class CollectionReference<T = DocumentData> extends Query<T> {
	/** The type of this Accountable reference. */
	public readonly type = "collection";

	/** The collection's identifier. */
	public readonly id: Readonly<CollectionID>;

	constructor(db: AccountableDB, id: CollectionID) {
		super(db);
		this.id = id;
	}

	/**
	 * A string representing the path of the referenced collection (relative
	 * to the root of the database).
	 */
	get path(): string {
		return this.id.slice();
	}

	toString(): string {
		return JSON.stringify({
			type: this.type,
			id: this.id,
			path: this.path,
		});
	}
}

/**
 * Gets a `CollectionReference` instance that refers to the collection at
 * the specified absolute path.
 *
 * @param db - A reference to the root `AccountableDB` instance.
 * @param path - A collection ID.
 * @returns The `CollectionReference` instance.
 */
export function collection<T = DocumentData>(
	db: AccountableDB,
	id: CollectionID
): CollectionReference<T> {
	return new CollectionReference(db, id);
}

export class DocumentReference<T = DocumentData> {
	/** The type of this database reference. */
	public readonly type = "document";

	/**
	 * The collection this `DocumentReference` belongs to.
	 */
	public readonly parent: CollectionReference<T>;

	/**
	 * The document's identifier within its collection.
	 */
	public readonly id: string;

	constructor(parent: CollectionReference<T>, id: string) {
		if (!id) throw new TypeError("ID cannot be empty");
		this.parent = parent;
		this.id = id;
	}

	/**
	 * The {@link AccountableDB} instance the document is in.
	 * This is useful for performing transactions, for example.
	 */
	get db(): AccountableDB {
		return this.parent.db;
	}

	/**
	 * A string representing the path of the referenced document (relative
	 * to the root of the database).
	 */
	get path(): string {
		const parentId = this.parent.id;
		const id = this.id;
		return `${parentId}/${id}`;
	}

	toString(): string {
		return JSON.stringify({
			type: this.type,
			id: this.id,
			path: this.path,
		});
	}
}

/**
 * Gets a `DocumentReference` instance that refers to the document at the
 * specified absolute path.
 *
 * @param collection - A collection to use as the parent of the document.
 * @param id - A document ID.
 * @returns The `DocumentReference` instance.
 */
export function doc<T = DocumentData>(collection: CollectionReference<T>): DocumentReference<T>;

/**
 * Gets a `DocumentReference` instance that refers to the document at the
 * specified absolute path.
 *
 * @param db - A reference to the root `AccountableDB` instance.
 * @param collection - A collection ID.
 * @param id - A document ID.
 * @returns The `DocumentReference` instance.
 */
export function doc<T = DocumentData>(
	db: AccountableDB,
	collection: CollectionID,
	id: string
): DocumentReference<T>;

export function doc<T = DocumentData>(
	dbOrCollection: AccountableDB | CollectionReference<T>,
	collection?: CollectionID,
	id?: string
): DocumentReference<T> {
	if ("url" in dbOrCollection) {
		if (!collection || id === undefined) {
			throw new TypeError(`Missing property in constructor`);
		}
		const parent = new CollectionReference<T>(dbOrCollection, collection);
		return new DocumentReference(parent, id);
	}
	const newId = uuid().replace(/-/gu, ""); // remove hyphens);
	return new DocumentReference(dbOrCollection, newId);
}

interface PutOperation {
	type: "set";
	ref: DocumentReference;
	primitiveData: DocumentData;
}

interface DeleteOperation {
	type: "delete";
	ref: DocumentReference;
}

type WriteOperation = PutOperation | DeleteOperation;

export class WriteBatch {
	#db: AccountableDB | null;
	#operations: Array<WriteOperation>;

	constructor() {
		this.#db = null;
		this.#operations = [];
	}

	#pushOperation(op: WriteOperation): void {
		// Ensure limit
		const OP_LIMIT = 500;
		if (this.#operations.length >= OP_LIMIT) {
			throw new RangeError(`Cannot batch more than ${OP_LIMIT} write operations.`);
		}

		// Same db
		if (!this.#db) {
			this.#db = op.ref.db;
		} else if (op.ref.db !== this.#db) {
			throw new EvalError("Must use exactly one database in a write batch");
		}

		// Push operation
		this.#operations.push(op);
	}

	set<T>(ref: DocumentReference<T>, data: T): void {
		const primitiveData: DocumentData = {};
		Object.entries(data).forEach(([key, value]) => {
			if (!isPrimitive(value)) return;
			primitiveData[key] = value;
		});
		this.#pushOperation({ type: "set", ref, primitiveData });
	}

	delete<T = DocumentData>(ref: DocumentReference<T>): void {
		this.#pushOperation({ type: "delete", ref });
	}

	async commit(): Promise<void> {
		if (!this.#db) return; // nothing to commit

		// Build and commit the list of operations in one go
		const jwt = this.#db.jwt;
		const currentUser = this.#db.currentUser;
		if (jwt === null || !currentUser) throw new AccountableError("database/unauthenticated");

		const uid = currentUser.uid;
		const batch = new URL(databaseBatchWrite(uid), this.#db.url);

		const data: Array<DocumentWriteBatch> = [];

		this.#operations.forEach(op => {
			const collectionId = op.ref.parent.id;
			const documentId = op.ref.id;
			const ref = { collectionId, documentId };

			switch (op.type) {
				case "delete":
					data.push({ type: "delete", ref });
					break;
				case "set":
					data.push({ type: "set", ref, data: op.primitiveData });
					break;
			}
		});

		await postTo(batch, data, jwt);
	}

	toString(): string {
		return JSON.stringify({
			operations: `<${this.#operations.length} operations>`,
		});
	}
}

export function writeBatch(): WriteBatch {
	return new WriteBatch();
}

export let db: AccountableDB;

export function isWrapperInstantiated(): boolean {
	return db !== undefined;
}

/**
 * Bootstrap our app using either environment variables or provided params.
 *
 * @param url The server URL to use instead of environment variables
 * to instantiate the backend connection.
 */
export function bootstrap(url?: string): AccountableDB {
	if (isWrapperInstantiated()) {
		throw new TypeError("db has already been instantiated");
	}

	// VITE_ env variables get type definitions in env.d.ts
	const serverUrl = url ?? import.meta.env.VITE_ACCOUNTABLE_SERVER_URL;

	if (serverUrl === undefined || !serverUrl) {
		throw new TypeError("No value found for environment variable VITE_ACCOUNTABLE_SERVER_URL");
	}

	db = new AccountableDB(serverUrl);
	return db;
}

interface UserStats {
	totalSpace: number | null;
	usedSpace: number | null;
}

/**
 * A local cache of the user's storage stats.
 *
 * @deprecated The only files that should see or modify this are `db.ts`, `storage.ts`, and `auth.ts`.
 */
export const previousStats: UserStats = {
	totalSpace: null,
	usedSpace: null,
};

/**
 * Gets statistics about the space the user's data occupies on the server.
 */
export async function getUserStats(): Promise<UserStats> {
	// This might be on the server too, but since Accountable gets this back with every write, we keep a copy here and use an async function to retrieve it.
	return Promise.resolve(previousStats);
}

/**
 * Reads the document referred to by this `DocumentReference`.
 *
 * @param reference - The reference of the document to fetch.
 * @returns A Promise resolved with a `DocumentSnapshot` containing the
 * current document contents.
 */
export async function getDoc<D, T extends PrimitiveRecord<D>>(
	reference: DocumentReference<T>
): Promise<DocumentSnapshot<T>> {
	const jwt = reference.db.jwt;
	const currentUser = reference.db.currentUser;
	if (jwt === null || !currentUser) throw new AccountableError("database/unauthenticated");

	const uid = currentUser.uid;
	const collection = reference.parent.id;
	const doc = reference.id;

	const docPath = new URL(databaseDocument(uid, collection, doc), reference.db.url);
	const { data } = await getFrom(docPath, jwt);

	if (data === undefined) throw new TypeError("Expected data from server, but got none");
	if (isArray(data))
		throw new TypeError("Expected a single document from server, but got an array");

	return new DocumentSnapshot<T>(reference, data as T | null);
}

/**
 * Writes to the document referred to by this `DocumentReference`. If the
 * document does not yet exist, it will be created.
 *
 * @param reference - A reference to the document to write.
 * @param data - A map of the fields and values for the document.
 * @returns A `Promise` resolved once the data has been successfully written
 * to the backend (note that it won't resolve while you're offline).
 */
export async function setDoc<D, T extends PrimitiveRecord<D>>(
	reference: DocumentReference<T>,
	data: T
): Promise<void> {
	const jwt = reference.db.jwt;
	const currentUser = reference.db.currentUser;
	if (jwt === null || !currentUser) throw new AccountableError("database/unauthenticated");

	const uid = currentUser.uid;
	const collection = reference.parent.id;
	const doc = reference.id;
	const docPath = new URL(databaseDocument(uid, collection, doc), reference.db.url);

	const { usedSpace, totalSpace } = await postTo(docPath, data, jwt);
	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;
}

/**
 * Deletes the document referred to by the specified `DocumentReference`.
 *
 * @param reference - A reference to the document to delete.
 * @returns A Promise resolved once the document has been successfully
 * deleted from the backend (note that it won't resolve while you're offline).
 */
export async function deleteDoc(reference: DocumentReference): Promise<void> {
	const jwt = reference.db.jwt;
	const currentUser = reference.db.currentUser;
	if (jwt === null || !currentUser) throw new AccountableError("database/unauthenticated");

	const uid = currentUser.uid;
	const collection = reference.parent.id;
	const doc = reference.id;
	const docPath = new URL(databaseDocument(uid, collection, doc), reference.db.url);

	const { usedSpace, totalSpace } = await deleteAt(docPath, jwt);
	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;
}

/**
 * Executes the query and returns the results as a `QuerySnapshot`.
 *
 * @returns A `Promise` that will be resolved with the results of the query.
 */
export async function getDocs<T>(query: CollectionReference<T>): Promise<QuerySnapshot<T>> {
	const jwt = query.db.jwt;
	const currentUser = query.db.currentUser;
	if (jwt === null || !currentUser) throw new AccountableError("database/unauthenticated");

	const uid = currentUser.uid;
	const collection = query.id;
	const collPath = new URL(databaseCollection(uid, collection), query.db.url);

	const { data } = await getFrom(collPath, jwt);
	if (data === undefined) throw new TypeError("Expected data from server, but got none");
	if (data === null || !isArray(data))
		throw new TypeError("Expected an array of documents from server, but got one document");

	return new QuerySnapshot(
		query,
		data.map(data => {
			const id = data["_id"];
			delete data["_id"];
			if (!isString(id)) throw new TypeError("Expected ID to be string");

			return new QueryDocumentSnapshot(new DocumentReference(query, id), data as unknown as T);
		})
	);
}

export function watchAllRecords<T = DocumentData>(
	collection: CollectionReference<T>,
	onSnap: (snap: QuerySnapshot<T>) => void | Promise<void>,
	onError?: ((error: Error) => void) | undefined
): Unsubscribe {
	const queueId = `watchAllRecords-${collection.path}`;
	const queue = useJobQueue<QuerySnapshot<T>>(queueId);
	queue.process(onSnap);
	const unsubscribe = onSnapshot<T>(collection, snap => queue.createJob(snap), onError);

	return (): void => {
		unsubscribe();
		forgetJobQueue(queueId);
	};
}

export function watchRecord<T = DocumentData>(
	doc: DocumentReference<T>,
	onSnap: (snap: DocumentSnapshot<T>) => void | Promise<void>,
	onError?: ((error: Error) => void) | undefined
): Unsubscribe {
	const queueId = `watchRecord-${doc.path}`;
	const queue = useJobQueue<DocumentSnapshot<T>>(queueId);
	queue.process(onSnap);
	const unsubscribe = onSnapshot(doc, snap => queue.createJob(snap), onError);

	return (): void => {
		unsubscribe();
		forgetJobQueue(queueId);
	};
}

export function recordFromSnapshot<G>(
	doc: QueryDocumentSnapshot<EPackage<unknown>>,
	dek: HashStore,
	typeGuard: ValueIteratorTypeGuard<unknown, G>
): { id: string; record: G } {
	const pkg = doc.data();
	const record = decrypt(pkg, dek);
	if (!typeGuard(record)) {
		throw new TypeError(`Failed to parse record from Firestore document ${doc.id}`);
	}
	return { id: doc.id, record };
}

export type { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot, Unsubscribe };
