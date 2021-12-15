import type { AnyDataItem } from "./schemas.js";
import type { CollectionReference, DocumentReference } from "./references.js";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

const DB_PORT = 27017;
const DB_URI = `mongodb://localhost:${DB_PORT}/accountable`;

/** Returns a fresh document ID that is virtually guaranteed not to have been used before. */
export function newDocumentId(this: void): string {
	return uuid();
}

export async function fetchDbCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<Array<T>> {
	const mon = await mongoose.connect(DB_URI);
	const conn = mon.connection;
	const db = conn.db;
	if (db === undefined) throw new EvalError("Database not initialized");

	const collection = db.collection<T>(ref.id);
	const query = collection.find({}).stream();

	return new Promise<Array<T>>((resolve, reject) => {
		const results: Array<T> = [];
		query.on("data", doc => {
			results.push(doc as T);
		});
		query.on("error", reject);
		query.on("close", () => {
			resolve(results);
		});
	});
}

export async function fetchDbDoc<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<T | null> {
	const mon = await mongoose.connect(DB_URI);
	const conn = mon.connection;
	const db = conn.db;
	if (db === undefined) throw new EvalError("Database not initialized");

	const collection = db.collection<AnyDataItem>(ref.parent.id);
	return (await collection.findOne({ _id: ref.id })) as T;
}

export async function upsertDbDoc<T extends AnyDataItem>(
	ref: DocumentReference<T>,
	data: T
): Promise<void> {
	const mon = await mongoose.connect(DB_URI);
	const conn = mon.connection;
	const db = conn.db;
	if (db === undefined) throw new EvalError("Database not initialized");

	const collection = db.collection(ref.parent.id);
	await collection.replaceOne({ _id: ref.id }, data, { upsert: true });
}

export async function deleteDbDoc<T extends AnyDataItem>(ref: DocumentReference<T>): Promise<void> {
	const mon = await mongoose.connect(DB_URI);
	const conn = mon.connection;
	const db = conn.db;
	if (db === undefined) throw new EvalError("Database not initialized");

	const collection = db.collection(ref.parent.id);
	await collection.deleteOne({ _id: ref.id });
}

export async function deleteDbCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<void> {
	const mon = await mongoose.connect(DB_URI);
	const conn = mon.connection;
	const db = conn.db;
	if (db === undefined) throw new EvalError("Database not initialized");

	await db.dropCollection(ref.id);
}
