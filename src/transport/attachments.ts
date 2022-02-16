import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";
import type { StorageReference } from "./storage.js";
import type { AttachmentRecordParams } from "../model/Attachment";
import type { EPackage, HashStore } from "./cryption";
import { Attachment } from "../model/Attachment";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";
import { deleteObject, downloadString, ref, uploadString } from "./storage.js";
import { encrypt, decrypt } from "./cryption";
import { dataUrlFromFile } from "./getDataAtUrl";

interface AttachmentRecordPackageMetadata {
	objectType: "Attachment";
}
export type AttachmentRecordPackage = EPackage<AttachmentRecordPackageMetadata>;

export function attachmentsCollection(): CollectionReference<AttachmentRecordPackage> {
	return collection<AttachmentRecordPackage>(db, "attachments");
}

function attachmentRef(
	uid: string,
	attachment: Attachment
): DocumentReference<AttachmentRecordPackage> {
	return doc<AttachmentRecordPackage>(db, "attachments", attachment.id);
}

function attachmentStorageRef(storagePath: string): StorageReference {
	// For some reason, String.prototype.match does not work for this
	const parts =
		Array.from(storagePath.matchAll(/users\/([\w\d]+)\/attachments\/([\w\d]+)\.json/gu))[0] ?? [];
	const errMsg = `Invalid storage ref: ${storagePath}`;

	const uid = parts[1];
	const fileName = parts[2];
	if (uid === undefined) throw new TypeError(errMsg);
	if (fileName === undefined) throw new TypeError(errMsg);
	return ref(db, uid, fileName);
}

export async function embeddableDataForFile(dek: HashStore, file: Attachment): Promise<string> {
	const storageRef = attachmentStorageRef(file.storagePath);
	const encryptedData = await downloadString(storageRef);
	if (encryptedData === null) throw new EvalError("No data found at the ref");
	const pkg = JSON.parse(encryptedData) as { ciphertext: string };
	if (!("ciphertext" in pkg)) {
		throw new TypeError("Improperly formatted payload.");
	}

	const imageData = decrypt(pkg, dek);
	if (typeof imageData !== "string") {
		throw new TypeError(`Expected string output. Got ${typeof imageData}`);
	}
	return imageData;
}

export function attachmentFromSnapshot(
	doc: QueryDocumentSnapshot<AttachmentRecordPackage>,
	dek: HashStore
): Attachment {
	const { id, record } = recordFromSnapshot(doc, dek, Attachment.isRecord);
	const storagePath = record.storagePath;
	return new Attachment(id, storagePath, record);
}

export async function createAttachment(
	uid: string,
	file: File,
	record: Omit<AttachmentRecordParams, "storagePath">,
	dek: HashStore
): Promise<Attachment> {
	const meta: AttachmentRecordPackageMetadata = {
		objectType: "Attachment",
	};
	const imageData = await dataUrlFromFile(file);
	const fileToUpload = JSON.stringify(encrypt(imageData, {}, dek));

	const ref = doc(attachmentsCollection()); // generates unique document ID
	const storageName = doc(attachmentsCollection()); // generates unique file name

	const storagePath = `users/${uid}/attachments/${storageName.id}.json`;
	const storageRef = attachmentStorageRef(storagePath);
	await uploadString(storageRef, fileToUpload); // Store the attachment

	const recordToSave = record as typeof record & { storagePath?: string };
	recordToSave.storagePath = storagePath;
	const pkg = encrypt(recordToSave, meta, dek);
	await setDoc(ref, pkg); // Save the record

	return new Attachment(ref.id, storagePath, recordToSave);
}

export async function updateAttachment(
	uid: string,
	file: File | null,
	attachment: Attachment,
	dek: HashStore
): Promise<void> {
	const meta: AttachmentRecordPackageMetadata = {
		objectType: "Attachment",
	};

	const record: AttachmentRecordParams = attachment.toRecord();
	const pkg = encrypt(record, meta, dek);
	await setDoc(attachmentRef(uid, attachment), pkg);

	if (file) {
		// delete the old file
		const storageRef = attachmentStorageRef(attachment.storagePath);
		await deleteObject(storageRef);

		// store the new file
		const imageData = await dataUrlFromFile(file);
		const fileToUpload = JSON.stringify(encrypt(imageData, {}, dek));

		await uploadString(storageRef, fileToUpload);
	}
}

export async function deleteAttachment(
	uid: string,
	attachment: Attachment,
	batch?: WriteBatch
): Promise<void> {
	// Delete the storage blob
	const storageRef = attachmentStorageRef(attachment.storagePath);
	await deleteObject(storageRef);

	// Delete the metadata entry
	const ref = attachmentRef(uid, attachment);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
