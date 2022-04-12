import type { AnyDataItem, Identified, IdentifiedDataItem, User } from "./schemas.js";
import type { CollectionReference, DocumentReference } from "./references.js";
import { env, requireEnv } from "../environment.js";
import { fileURLToPath } from "url";
import { folderSize, maxSpacePerUser } from "../auth/limits.js";
import { mkdir } from "fs/promises";
import { UnreachableCaseError } from "../errors/index.js";
import mongoose from "mongoose";
import path from "path";
import {
	AccountModel,
	AttachmentModel,
	KeysModel,
	LocationModel,
	TagModel,
	TransactionModel,
	UserModel,
} from "./schemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start connecting to the database
const DB_URL = requireEnv("MONGO_CONNECTION_URL");
await mongoose.connect(DB_URL);
process.stdout.write("Connected to MongoDB\n");

/** @deprecated `multer` does this automatically */
export async function ensure(path: string): Promise<void> {
	// process.stdout.write(`Ensuring directory is available at ${path}...\n`);
	await mkdir(path, { recursive: true });
}

// The place where the user's encrypted attachments live
function dbFolderForUser(uid: string): string {
	const DB_ROOT = env("DB") ?? path.resolve(__dirname, "../db");
	const dir = path.join(DB_ROOT, "users", uid);
	console.debug(`dbFolderForUser(uid: ${uid}) ${dir}`);
	return dir;
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

export async function fetchDbCollection(
	ref: CollectionReference<AnyDataItem>
): Promise<Array<IdentifiedDataItem>> {
	const uid = ref.uid;

	switch (ref.id) {
		case "accounts":
			return await AccountModel.find({ uid });
		case "attachments":
			return await AttachmentModel.find({ uid });
		case "keys":
			return await KeysModel.find({ uid });
		case "locations":
			return await LocationModel.find({ uid });
		case "tags":
			return await TagModel.find({ uid });
		case "transactions":
			return await TransactionModel.find({ uid });
		case "users":
			// Special handling: fetch all users
			return await UserModel.find();
		default:
			throw new UnreachableCaseError(ref.id);
	}
}

export async function findUserWithProperties(query: Partial<User>): Promise<User | null> {
	if (Object.keys(query).length === 0) return null; // Fail gracefully for an empty query
	const results = await UserModel.find(query);
	return results[0] ?? null; // first result or null
}

export async function fetchDbDocs<T extends AnyDataItem>(
	refs: NonEmptyArray<DocumentReference<T>>
): Promise<Array<[DocumentReference<T>, Identified<T> | null]>> {
	// Assert same UID on all refs
	const uid = refs[0].uid;
	if (!refs.every(u => u.uid === uid))
		throw new TypeError(`Not every UID matches the first: ${uid}`);

	return await Promise.all(
		refs.map(async ref => {
			const collectionId = ref.parent.id;
			const _id = ref.id;
			switch (collectionId) {
				case "accounts":
					return [ref, await AccountModel.findById(_id)];
				case "attachments":
					return [ref, await AttachmentModel.findById(_id)];
				case "keys":
					return [ref, await KeysModel.findById(_id)];
				case "locations":
					return [ref, await LocationModel.findById(_id)];
				case "tags":
					return [ref, await TagModel.findById(_id)];
				case "transactions":
					return [ref, await TransactionModel.findById(_id)];
				case "users":
					return [ref, await UserModel.findById(_id)];
				default:
					throw new UnreachableCaseError(collectionId);
			}
		})
	);
}

export async function fetchDbDoc<T extends AnyDataItem>(
	ref: DocumentReference<T>
): Promise<Identified<T> | null> {
	const [pair] = await fetchDbDocs([ref]);
	if (!pair) return null;
	return pair[1];
}

export async function upsertUser(properties: User): Promise<void> {
	const uid = properties.uid;
	if (!uid) throw new TypeError("uid property was empty");

	await UserModel.findByIdAndUpdate(properties.uid, properties, { upsert: true });
}

export async function destroyUser(uid: string): Promise<void> {
	if (!uid) throw new TypeError("uid was empty");

	await AccountModel.deleteMany({ uid });
	await AttachmentModel.deleteMany({ uid });
	await KeysModel.deleteMany({ uid });
	await LocationModel.deleteMany({ uid });
	await TagModel.deleteMany({ uid });
	await TransactionModel.deleteMany({ uid });
	await UserModel.findByIdAndDelete(uid);
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

	await Promise.all(
		updates.map(async ({ data, ref }) => {
			const collectionId = ref.parent.id;
			const _id = ref.id;
			switch (collectionId) {
				case "accounts":
					await AccountModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				case "attachments":
					await AttachmentModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				case "keys":
					await KeysModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				case "locations":
					await LocationModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				case "tags":
					await TagModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				case "transactions":
					await TransactionModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				case "users":
					await UserModel.findByIdAndUpdate(_id, data, { upsert: true });
					return;
				default:
					throw new UnreachableCaseError(collectionId);
			}
		})
	);
}

export async function deleteDbDocs<T extends AnyDataItem>(
	refs: NonEmptyArray<DocumentReference<T>>
): Promise<void> {
	// Assert same UID on all refs
	const uid = refs[0].uid;
	if (!refs.every(u => u.uid === uid))
		throw new TypeError(`Not every UID matches the first: ${uid}`);

	await Promise.all(
		refs.map(async ref => {
			const collectionId = ref.parent.id;
			const _id = ref.id;
			switch (collectionId) {
				case "accounts":
					await AccountModel.findByIdAndDelete(_id);
					return;
				case "attachments":
					await AttachmentModel.findByIdAndDelete(_id);
					return;
				case "keys":
					await KeysModel.findByIdAndDelete(_id);
					return;
				case "locations":
					await LocationModel.findByIdAndDelete(_id);
					return;
				case "tags":
					await TagModel.findByIdAndDelete(_id);
					return;
				case "transactions":
					await TransactionModel.findByIdAndDelete(_id);
					return;
				case "users":
					await UserModel.findByIdAndDelete(_id);
					return;
				default:
					throw new UnreachableCaseError(collectionId);
			}
		})
	);
}

export async function deleteDbDoc<T extends AnyDataItem>(ref: DocumentReference<T>): Promise<void> {
	await deleteDbDocs([ref]);
}

export async function deleteDbCollection<T extends AnyDataItem>(
	ref: CollectionReference<T>
): Promise<void> {
	const uid = ref.uid;

	switch (ref.id) {
		case "accounts":
			await AccountModel.deleteMany({ uid });
			return;
		case "attachments":
			await AttachmentModel.deleteMany({ uid });
			return;
		case "keys":
			await KeysModel.deleteMany({ uid });
			return;
		case "locations":
			await LocationModel.deleteMany({ uid });
			return;
		case "tags":
			await TagModel.deleteMany({ uid });
			return;
		case "transactions":
			await TransactionModel.deleteMany({ uid });
			return;
		case "users":
			// Special handling: delete all users, and burn everything
			await AccountModel.deleteMany();
			await AttachmentModel.deleteMany();
			await KeysModel.deleteMany();
			await LocationModel.deleteMany();
			await TagModel.deleteMany();
			await TransactionModel.deleteMany();
			await UserModel.deleteMany();
			return;
		default:
			throw new UnreachableCaseError(ref.id);
	}
}
