import type { DataItem } from "./schemas.js";
import type { DocumentReference } from "./references.js";
import { dataSchema } from "./schemas.js";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

const DB_PORT = 27017;
const DB_URI = `mongodb://localhost:${DB_PORT}/testdb`;

/** Returns a fresh document ID that is virtually guaranteed not to have been used before. */
export function newDocumentId(this: void): string {
	return uuid();
}

/** Initializes our MongoDB client. Do not send requests until this resolves. */
export async function initialize(): Promise<void> {
	await mongoose.connect(DB_URI);
}

export async function fetchDoc(ref: DocumentReference): Promise<DataItem | null> {
	const conn = mongoose.createConnection(DB_URI);
	const Data = conn.model("Data", dataSchema);

	const data = await Data.findById(ref.id);

	return data;
}

export async function upsertDoc(data: DataItem, ref: DocumentReference): Promise<void> {
	const conn = mongoose.createConnection(DB_URI);
	const Data = conn.model("Data", dataSchema);
	await Data.replaceOne({ _id: ref.id }, data);
}

export async function deleteDoc(ref: DocumentReference): Promise<void> {
	const conn = mongoose.createConnection(DB_URI);
	const Data = conn.model("Data", dataSchema);
	await Data.deleteOne({ _id: ref.id });
}
