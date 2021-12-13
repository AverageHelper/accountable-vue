import type { AnyDataItem } from "./schemas.js";
import type { CollectionReference, DocumentReference } from "./references.js";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

const DB_PORT = 27017;
const DB_URI = `mongodb://localhost:${DB_PORT}/testdb`;

/** Returns a fresh document ID that is virtually guaranteed not to have been used before. */
export function newDocumentId(this: void): string {
	return uuid();
}

export async function fetchDbCollection(ref: CollectionReference): Promise<Array<AnyDataItem>> {
	const conn = mongoose.createConnection(DB_URI);
	const db = conn.db;
	const collection = db.collection<AnyDataItem>(ref.id);
	const query = collection.find({}).stream();

	return new Promise<Array<AnyDataItem>>((resolve, reject) => {
		const results: Array<AnyDataItem> = [];
		query.on("data", doc => {
			results.push(doc as AnyDataItem);
		});
		query.on("error", reject);
		query.on("close", () => {
			resolve(results);
		});
	});
}

export async function fetchDbDoc(ref: DocumentReference): Promise<AnyDataItem | null> {
	const conn = mongoose.createConnection(DB_URI);
	const db = conn.db;
	const collection = db.collection<AnyDataItem>(ref.parent.id);
	return await collection.findOne({ _id: ref.id });
}

export async function upsertDbDoc(ref: DocumentReference, data: AnyDataItem): Promise<void> {
	const conn = mongoose.createConnection(DB_URI);
	const db = conn.db;
	const collection = db.collection(ref.parent.id);
	await collection.replaceOne({ _id: ref.id }, data, { upsert: true });
}

export async function deleteDbDoc(ref: DocumentReference): Promise<void> {
	const conn = mongoose.createConnection(DB_URI);
	const db = conn.db;
	const collection = db.collection(ref.parent.id);
	await collection.deleteOne({ _id: ref.id });
}

export async function deleteDbCollection(ref: CollectionReference): Promise<void> {
	const conn = mongoose.createConnection(DB_URI);
	const db = conn.db;
	await db.dropCollection(ref.id);
}
