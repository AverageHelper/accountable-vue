/* eslint-disable deprecation/deprecation */
import type { AccountableDB, DocumentReference } from "./db";
import type { AttachmentRecordPackage } from "./attachments";
import { AccountableError } from "./errors/index.js";
import { previousStats } from "./db";
import { deleteAt, downloadFrom, storageFile, uploadTo } from "./api-types/index.js";

/**
 * Represents a reference to an Accountable Storage object. Developers can
 * upload, download, and delete objects, as well as get/set object metadata.
 */
export interface StorageReference {
	/**
	 * The {@link AccountableDB} instance associated with this reference.
	 */
	readonly db: AccountableDB;

	/**
	 * The ID of the user which owns the storage object.
	 */
	readonly uid: Readonly<string>;

	/**
	 * A reference to the document that owns this storage reference.
	 */
	readonly docRef: DocumentReference<AttachmentRecordPackage>;

	/**
	 * The short name of this object, which is the last component of the full path.
	 * For example, if fullPath is 'full/path/image.png', name is 'image.png'.
	 */
	readonly name: Readonly<string>;
}

/**
 * Returns a {@link StorageReference} for the given url.
 * @param db - {@link AccountableDB} instance.
 * @param uid - The ID of the user that owns the reference.
 * @param docRef - A reference to the document that owns the reference.
 * @param name - The file name.
 */
export function ref(
	db: AccountableDB,
	uid: string,
	docRef: DocumentReference<AttachmentRecordPackage>,
	name: string
): StorageReference {
	return { db, uid, docRef, name };
}

/**
 * Downloads a string from this object's location.
 * @param ref - {@link StorageReference} where string should exist.
 *
 * @throws an {@link AccountableError} if there was a problem, including
 * 	if the file was not found.
 * @returns The stored string.
 */
export async function downloadString(ref: StorageReference): Promise<string> {
	const uid = ref.db.currentUser?.uid;
	if (uid === undefined || !uid) throw new AccountableError("storage/unauthenticated");
	if (ref.docRef.parent.id !== "attachments")
		throw new AccountableError("storage/invalid-argument");

	const itemPath = storageFile(uid, ref.docRef.id, `${ref.name}.json`);
	const url = new URL(itemPath, ref.db.url);
	return await downloadFrom(url);
}

/**
 * Uploads a string to this object's location.
 * The upload is not resumable.
 * @param ref - {@link StorageReference} where string should be uploaded.
 * @param value - The string to upload.
 */
export async function uploadString(ref: StorageReference, value: string): Promise<void> {
	const uid = ref.db.currentUser?.uid;
	if (uid === undefined || !uid) throw new AccountableError("storage/unauthenticated");

	const itemPath = storageFile(uid, ref.docRef.id, `${ref.name}.json`);
	const url = new URL(itemPath, ref.db.url);
	const { usedSpace, totalSpace } = await uploadTo(url, value);
	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;
}

/**
 * Deletes the object at this location.
 * @param ref - {@link StorageReference} for object to delete.
 *
 * @returns A `Promise` that resolves if the deletion succeeds.
 */
export async function deleteObject(ref: StorageReference): Promise<void> {
	const uid = ref.db.currentUser?.uid;
	if (uid === undefined || !uid) throw new AccountableError("storage/unauthenticated");

	const itemPath = storageFile(uid, ref.docRef.id, `${ref.name}.json`);
	const url = new URL(itemPath, ref.db.url);
	const { usedSpace, totalSpace } = await deleteAt(url);
	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;
}
