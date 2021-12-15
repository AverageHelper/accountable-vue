import type { AnyDataItem } from "./schemas.js";
import type { CollectionReference, DocumentReference } from "./references.js";
import type { Db } from "mongoose/node_modules/mongodb";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";
import { timeout } from "../timeout.js";

const DB_PORT = 27017;
const DB_URI = `mongodb://localhost:${DB_PORT}/accountable`;

/** Returns a fresh document ID that is virtually guaranteed not to have been used before. */
export function newDocumentId(this: void): string {
	return uuid();
}

process.stdout.write(`Connecting to MongoDB at '${DB_URI}'...\n`);
const dbPromise: Promise<Db> = timeout(() => mongoose.connect(DB_URI), 30000)
	.then((mon): Db => {
		process.stdout.write("Connected!\n");
		const conn = mon.connection;
		const db = conn.db;
		if (db === undefined) throw new EvalError("Database not initialized");
		return db;
	})
	.catch((error: unknown) => {
		console.error(error);
		throw error;
	});

export async function fetchDbCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<Array<T>> {
	const db = await dbPromise;
	const collection = db.collection<T>(ref.id);
	const query = collection.find<T>({});

	const results: Array<T> = [];
	let next = await query.next();
	while (next !== null) {
		results.push(next);
		next = await query.next();
	}
	return results;
}

export async function fetchDbDoc<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<T | null> {
	const db = await dbPromise;
	const collection = db.collection<AnyDataItem>(ref.parent.id);
	return (await collection.findOne({ _id: ref.id })) as T;
}

export async function upsertDbDoc<T extends AnyDataItem>(
	ref: DocumentReference<T>,
	data: T
): Promise<void> {
	const db = await dbPromise;
	const collection = db.collection(ref.parent.id);
	await collection.replaceOne({ _id: ref.id }, data, { upsert: true });
}

export async function deleteDbDoc<T extends AnyDataItem>(ref: DocumentReference<T>): Promise<void> {
	const db = await dbPromise;
	const collection = db.collection(ref.parent.id);
	await collection.deleteOne({ _id: ref.id });
}

export async function deleteDbCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<void> {
	const db = await dbPromise;
	await db.dropCollection(ref.id);
}
