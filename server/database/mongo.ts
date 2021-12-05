import { MongoClient } from "mongodb";
import { v4 as uuid } from "uuid";
import path from "path";

const dbPath = path.resolve(__dirname, "./db/database.mongo");

let client: MongoClient | null = null;

export async function connectedClient(): Promise<MongoClient> {
	if (client) return client;

	client = new MongoClient(dbPath);
	await client.connect();
	return client;
}

/** Returns a fresh document ID that is virtually guaranteed not to have been used before. */
export function newDocumentId(this: void): string {
	return uuid();
}
