import type { AccountableDB } from "./db";
import { AccountableError } from "./db";
import { deleteAt, downloadFrom, uploadTo } from "./networking";

/**
 * Represents a reference to an Accountable Storage object. Developers can
 * upload, download, and delete objects, as well as get/set object metadata.
 */
export class StorageReference {
	/**
	 * The {@link AccountableDB} instance associated with this reference.
	 */
	public readonly db: AccountableDB;

	/**
	 * The ID of the user which owns the storage object.
	 */
	public readonly uid: Readonly<string>;

	/**
	 * The short name of this object, which is the last component of the full path.
	 * For example, if fullPath is 'full/path/image.png', name is 'image.png'.
	 */
	public readonly name: Readonly<string>;

	constructor(db: AccountableDB, uid: string, name: string) {
		this.db = db;
		this.uid = uid;
		this.name = name;
	}

	/**
	 * The full path of this object.
	 */
	get fullPath(): string {
		return `users/${this.uid}/attachments/${this.name}`;
	}

	toString(): string {
		return JSON.stringify({
			uid: this.uid,
			name: this.name,
			fullPath: this.fullPath,
		});
	}
}

/**
 * Returns a {@link StorageReference} for the given url.
 * @param db - {@link AccountableDB} instance.
 * @param uid - The ID of the user that owns the reference.
 * @param name - The file name.
 */
export function ref(db: AccountableDB, uid: string, name: string): StorageReference {
	return new StorageReference(db, uid, name);
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
	const jwt = ref.db.jwt;
	if (jwt === null || uid === undefined || !uid)
		throw new AccountableError("storage/unauthenticated");

	const itemPath = `users/${uid}/attachments/${ref.name}`;
	const url = new URL(itemPath, ref.db.url);
	return await downloadFrom(url, jwt);
}

/**
 * Uploads a string to this object's location.
 * The upload is not resumable.
 * @param ref - {@link StorageReference} where string should be uploaded.
 * @param value - The string to upload.
 */
export async function uploadString(ref: StorageReference, value: string): Promise<void> {
	const uid = ref.db.currentUser?.uid;
	const jwt = ref.db.jwt;
	if (jwt === null || uid === undefined || !uid)
		throw new AccountableError("storage/unauthenticated");

	const itemPath = `users/${uid}/attachments/${ref.name}`;
	const url = new URL(itemPath, ref.db.url);
	await uploadTo(url, value, jwt);
}

/**
 * Deletes the object at this location.
 * @param ref - {@link StorageReference} for object to delete.
 *
 * @returns A `Promise` that resolves if the deletion succeeds.
 */
export async function deleteObject(ref: StorageReference): Promise<void> {
	const uid = ref.db.currentUser?.uid;
	const jwt = ref.db.jwt;
	if (jwt === null || uid === undefined || !uid)
		throw new AccountableError("storage/unauthenticated");

	const itemPath = `users/${uid}/attachments/${ref.name}`;
	const url = new URL(itemPath, ref.db.url);
	await deleteAt(url, jwt);
}
