import type { AnyDataItem, Identified, IdentifiedDataItem, User } from "./schemas.js";
import type { CollectionReference, DocumentReference } from "./references.js";
import { env } from "../environment.js";
import { fileURLToPath } from "url";
import { folderSize, maxSpacePerUser } from "../auth/limits.js";
import { Low, JSONFile } from "lowdb";
import { mkdir, rm, unlink } from "fs/promises";
import { NotEnoughRoomError } from "../errors/index.js";
import { simplifiedByteCount } from "../transformers/index.js";
import { useJobQueue } from "@averagehelper/job-queue";
import { v4 as uuid } from "uuid";
import path from "path";

export async function ensure(path: string): Promise<void> {
	// process.stdout.write(`Ensuring directory is available at ${path}...\n`);
	await mkdir(path, { recursive: true });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbEnv = env("DB") ?? "";

export const DB_DIR = dbEnv //
	? path.resolve(dbEnv)
	: path.resolve(__dirname, "../../db");
process.stdout.write(`Database and storage directory: ${DB_DIR}\n`);

/**
 * Returns a fresh document ID that is virtually guaranteed
 * not to have been used before.
 */
export function newDocumentId(this: void): string {
	return uuid().replace(/-/gu, ""); // remove hyphens
}

type UserIndexDb = Record<string, User>;
type UserDb = Record<string, Record<string, AnyDataItem>>;

async function userIndexDb<T>(
	cb: (db: UserIndexDb | null, write: (n: UserIndexDb | null) => void) => T
): Promise<T> {
	await ensure(DB_DIR);
	const file = path.join(DB_DIR, "users.json");
	const adapter = new JSONFile<UserIndexDb>(file);
	const db = new Low(adapter);
	await db.read();

	const data = db.data ? { ...db.data } : null;
	const writeQueue = useJobQueue<Low<UserIndexDb>>(file);
	const result = cb(data, newData => {
		writeQueue.process(db => db.write());
		db.data = newData;
		writeQueue.createJob(db);
	});

	if (writeQueue.length === 0) return result;
	return new Promise(resolve => {
		writeQueue.on("finish", () => resolve(result));
	});
}

function dbFolderForUser(uid: string): string {
	return path.join(DB_DIR, "users", uid);
}

interface UserStats {
	totalSpace: number;
	usedSpace: number;
}

export async function statsForUser(uid: string): Promise<UserStats> {
	const folder = dbFolderForUser(uid);
	const totalSpace = Math.ceil(maxSpacePerUser);
	const usedSpace = Math.ceil((await folderSize(folder)) ?? totalSpace);

	return { totalSpace, usedSpace };
}

async function dbForUser<T>(
	uid: string,
	cb: (db: UserDb | null, write: (n: UserDb | null) => void) => T
): Promise<T> {
	if (!uid) throw new TypeError("uid should not be empty");

	const folder = dbFolderForUser(uid);
	await ensure(folder);

	// Divide the disk space among a theoretical capacity of users
	// TODO: Prevent new signups if we've used every slot, and take users with only key-data into account
	const {
		totalSpace: maxSizeOfUserFolder, //
		usedSpace: sizeOfUserFolder,
	} = await statsForUser(uid);
	process.stdout.write(
		`User ${uid} has used ${simplifiedByteCount(sizeOfUserFolder)} of ${simplifiedByteCount(
			maxSpacePerUser
		)}\n`
	);

	const file = path.join(folder, "db.json");
	const adapter = new JSONFile<UserDb>(file);
	const db = new Low(adapter);
	await db.read();

	const data = db.data ? { ...db.data } : null;
	const writeQueue = useJobQueue<Low<UserDb>>(file);
	const result = cb(data, newData => {
		// No one user may occupy more space than the max
		const isNewDataLarger = JSON.stringify(newData).length > JSON.stringify(data).length;
		const isUserOutOfRoom = sizeOfUserFolder >= maxSizeOfUserFolder;
		if (isNewDataLarger && isUserOutOfRoom) throw new NotEnoughRoomError();

		writeQueue.process(db => db.write());
		db.data = newData;
		writeQueue.createJob(db);
	});

	if (writeQueue.length === 0) return result;
	return new Promise(resolve => {
		writeQueue.on("finish", () => resolve(result));
	});
}

async function destroyDbForUser(uid: string): Promise<void> {
	if (!uid) throw new TypeError("uid should not be empty");

	const folder = path.join(DB_DIR, "users", uid);
	await rm(folder, { recursive: true, force: true });
}

export async function numberOfUsers(): Promise<number> {
	const data = await userIndexDb(data => data);
	if (!data) return 0;
	return Object.keys(data).length;
}

export async function fetchDbCollection(
	ref: CollectionReference<AnyDataItem>
): Promise<Array<IdentifiedDataItem>> {
	let collection: Record<string, AnyDataItem>;

	if (ref.id === "users") {
		// Special handling, fetch all users
		const data = await userIndexDb(data => data);
		if (!data) return [];
		collection = data;
	} else {
		const data = await dbForUser(ref.uid, data => data);
		if (!data) return [];
		collection = data[ref.id] ?? {};
	}

	const entries = Object.entries(collection);
	return entries.map(([key, value]) => ({ ...value, _id: key }));
}

export async function findUserWithProperties(query: Partial<User>): Promise<User | null> {
	return await userIndexDb(collection => {
		if (!collection) return null;

		const result = Object.values(collection).find<User>((v: User): v is User => {
			// where all properties of `query` match those of `v`
			return Object.keys(query).every(key => {
				return v[key as keyof User] === query[key as keyof User];
			});
		});

		if (!result) return null;
		return { ...result };
	});
}

/** A view of database data. */
interface Snapshot<T extends AnyDataItem> {
	/** The database reference. */
	ref: DocumentReference<T>;

	/** The stored data for the reference. */
	data: Identified<T> | null;
}

/**
 * Fetches the referenced data item from the database.
 *
 * @param ref A document reference.
 * @returns a view of database data.
 */
export async function fetchDbDoc<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<Snapshot<T>> {
	const [snap] = await fetchDbDocs([ref]);
	return snap;
}

/**
 * Fetches the referenced data items from the database.
 *
 * @param refs An array of document references.
 * @returns an array containing the given references and their associated data.
 */
export async function fetchDbDocs<T extends AnyDataItem>(
	refs: NonEmptyArray<DocumentReference<T>>
): Promise<NonEmptyArray<Snapshot<T>>> {
	// Assert same UID on all refs
	const uid = refs[0].uid;
	if (!refs.every(u => u.uid === uid))
		throw new TypeError(`Not every UID matches the first: ${uid}`);

	return (await dbForUser(uid, data => {
		if (!data) return refs.map(ref => ({ ref, data: null }));

		return refs.map<Snapshot<T>>(ref => {
			const collection = data[ref.parent.id] ?? {};
			const docs = collection[ref.id] as T | undefined;
			if (!docs) {
				return { ref, data: null };
			}
			return { ref, data: { ...docs, _id: ref.id } };
		});
	})) as NonEmptyArray<Snapshot<T>>;
}

export async function upsertUser(properties: User): Promise<void> {
	const uid = properties.uid;
	if (!uid) throw new TypeError("uid property was empty");

	// Upsert to index
	await userIndexDb((data, write) => {
		const userIndex = data ?? {};
		userIndex[uid] = { ...properties };
		write(userIndex);
	});

	// Prep database
	await dbForUser(uid, (data, write) => {
		if (!data) write({});
	});
}

export async function destroyUser(uid: string): Promise<void> {
	if (!uid) throw new TypeError("uid was empty");

	// Delete index
	await userIndexDb((data, write) => {
		const userIndex = data ?? {};
		delete userIndex[uid];
		write(userIndex);
	});

	// Erase user data folder
	await destroyDbForUser(uid);
}

export interface DocUpdate<T extends AnyDataItem> {
	ref: DocumentReference<T>;
	data: T;
}

export async function upsertDbDocs<T extends AnyDataItem>(
	updates: NonEmptyArray<DocUpdate<T>>
): Promise<void> {
	// Assert same UID on all refs
	const uid = updates[0].ref.uid;
	if (!updates.every(u => u.ref.uid === uid))
		throw new TypeError(`Not every UID matches the first: ${uid}`);

	await dbForUser(uid, (storedData, write) => {
		const db = storedData ?? {};

		for (const { ref, data } of updates) {
			db[ref.parent.id] ??= {}; // upsert an empty object
			const collection = db[ref.parent.id] ?? {};
			collection[ref.id] = { ...data };
		}

		write(db); // commit the database
	});
}

export async function deleteDbDocs<T extends AnyDataItem>(
	refs: NonEmptyArray<DocumentReference<T>>
): Promise<void> {
	// Assert same UID on all refs
	const uid = refs[0].uid;
	if (!refs.every(u => u.uid === uid))
		throw new TypeError(`Not every UID matches the first: ${uid}`);

	await dbForUser(uid, (data, write) => {
		if (!data) return;

		for (const ref of refs) {
			const collection = data[ref.parent.id] ?? {};
			delete collection[ref.id]; // eat the document
		}

		write(data); // commit the database
	});
}

export async function deleteDbDoc<T extends AnyDataItem>(ref: DocumentReference<T>): Promise<void> {
	await deleteDbDocs([ref]);
}

export async function deleteDbCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<void> {
	if (ref.id === "users") {
		// Special handling, delete all users, burn everything
		const usersDir = path.join(DB_DIR, "users");
		await unlink(usersDir);

		// Clear the user index
		await dbForUser(ref.uid, (data, write) => {
			if (!data) return;
			write({});
		});
		return;
	}

	await dbForUser(ref.uid, (data, write) => {
		if (!data) return;
		delete data[ref.id]; // eat the collection
		write(data); // commit the database
	});
}
