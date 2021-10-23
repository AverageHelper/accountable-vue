import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
} from "firebase/firestore";
import type { StorageReference } from "firebase/storage";
import type { AttachmentRecordParams } from "../model/Attachment";
import type { EPackage, HashStore } from "./cryption";
import { Attachment } from "../model/Attachment";
import { encrypt, decrypt } from "./cryption";
import { db, storage, recordFromSnapshot } from "./db";
import { ref, getDownloadURL, uploadString, deleteObject } from "firebase/storage";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";

interface AttachmentRecordPackageMetadata {
	objectType: "Attachment";
}
type AttachmentRecordPackage = EPackage<AttachmentRecordPackageMetadata>;

export function attachmentsCollection(uid: string): CollectionReference<AttachmentRecordPackage> {
	const path = `users/${uid}/attachments`;
	return collection(db, path) as CollectionReference<AttachmentRecordPackage>;
}

function attachmentRef(
	uid: string,
	attachment: Attachment
): DocumentReference<AttachmentRecordPackage> {
	const path = `users/${uid}/attachments/${attachment.id}`;
	return doc(db, path) as DocumentReference<AttachmentRecordPackage>;
}

function attachmentStorageRef(storageUrl: string): StorageReference {
	return ref(storage, storageUrl);
}

async function getStringFromURL(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.responseType = "text";
		xhr.addEventListener("load", () => {
			const blob = xhr.response as string;
			resolve(blob);
		});
		xhr.addEventListener("error", () => {
			reject(xhr.response);
		});
		xhr.open("GET", url);
		xhr.send();
	});
}

export async function attachmentFromSnapshot(
	doc: QueryDocumentSnapshot<AttachmentRecordPackage>,
	dek: HashStore
): Promise<Attachment> {
	const { id, record } = recordFromSnapshot(doc, dek, Attachment.isRecord);
	const storageUrl = record.storageUrl;

	const ref = attachmentStorageRef(record.storageUrl);
	const url = await getDownloadURL(ref);

	// Create a data URL from the data
	const encryptedFileString = await getStringFromURL(url);
	const encryptedFile = JSON.parse(encryptedFileString) as EPackage<unknown>;
	const file = decrypt(encryptedFile, dek);
	const downloadUrl = URL.createObjectURL(file);
	const urls = { downloadUrl, storageUrl };
	return new Attachment(id, urls, record);
}

export async function createAttachment(
	uid: string,
	file: File,
	record: Omit<AttachmentRecordParams, "downloadUrl" | "storageUrl">,
	dek: HashStore
): Promise<Attachment> {
	const meta: AttachmentRecordPackageMetadata = {
		objectType: "Attachment",
	};
	const fileToUpload = JSON.stringify(encrypt(await file.text(), {}, dek));

	const ref = doc(attachmentsCollection(uid)); // generates unique document ID

	const storageUrl = `users/${uid}/attachments/${ref.id}`;
	const storageRef = attachmentStorageRef(storageUrl);
	await uploadString(storageRef, fileToUpload, "raw"); // Store the attachment
	const downloadUrl = await getDownloadURL(storageRef);

	const recordToSave = record as typeof record & { storageUrl?: string };
	recordToSave.storageUrl = storageUrl;
	const pkg = encrypt(recordToSave, meta, dek);
	await setDoc(ref, pkg); // Save the record

	return new Attachment(ref.id, { downloadUrl, storageUrl }, recordToSave);
}

export async function updateAttachment(
	uid: string,
	attachment: Attachment,
	dek: HashStore
): Promise<void> {
	const meta: AttachmentRecordPackageMetadata = {
		objectType: "Attachment",
	};

	const record: Omit<AttachmentRecordParams, "downloadUrl" | "storageUrl"> = {
		createdAt: attachment.createdAt,
		notes: attachment.notes,
		title: attachment.title,
	};
	const pkg = encrypt(record, meta, dek);
	await setDoc(attachmentRef(uid, attachment), pkg);
}

export async function deleteAttachment(uid: string, attachment: Attachment): Promise<void> {
	const storageRef = attachmentStorageRef(attachment.storageUrl);
	await deleteDoc(attachmentRef(uid, attachment));
	await deleteObject(storageRef);
}
