import type { Attachment, AttachmentRecordParams } from "../model/Attachment";
import type { AttachmentSchema } from "../model/DatabaseSchema";
import type { AttachmentRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { Entry as ZipEntry } from "@zip.js/zip.js";
import { attachment, recordFromAttachment } from "../model/Attachment";
import { BlobWriter } from "@zip.js/zip.js";
import { derived, get, writable } from "svelte/store";
import { getDekMaterial, pKey, uid } from "./authStore";
import { updateUserStats } from "./uiStore";
import chunk from "lodash/chunk";
import {
	addAttachmentToTransaction,
	removeAttachmentIdFromTransaction,
} from "../model/Transaction";
import {
	attachmentsCollection,
	createAttachment as _createAttachment,
	deleteAttachment as _deleteAttachment,
	deriveDEK,
	embeddableDataForFile,
	getDocs,
	updateAttachment as _updateAttachment,
	attachmentFromSnapshot,
	watchAllRecords,
	writeBatch,
} from "../transport";

export const attachments = writable<Record<string, Attachment>>({}); // Attachment.id -> Attachment
export const files = writable<Record<string, string>>({}); // Attachment.id -> image data URL
export const loadError = writable<Error | null>(null);
export const attachmentsWatcher = writable<Unsubscribe | null>(null);

export const allAttachments = derived(attachments, $attachments => {
	return Object.values($attachments);
});

export function clearAttachmentsCache(): void {
	const watcher = get(attachmentsWatcher);
	if (watcher) {
		watcher();
		attachmentsWatcher.set(null);
	}
	files.set({});
	attachments.set({});
	loadError.set(null);
	console.debug("attachmentsStore: cache cleared");
}

export async function watchAttachments(force: boolean = false): Promise<void> {
	const watcher = get(attachmentsWatcher);
	if (watcher && !force) return;

	if (watcher) {
		watcher();
		attachmentsWatcher.set(null);
	}

	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = attachmentsCollection();
	loadError.set(null);
	attachmentsWatcher.set(
		watchAllRecords(
			collection,
			snap => {
				snap.docChanges().forEach(change => {
					switch (change.type) {
						case "removed":
							attachments.update(attachments => {
								const copy = { ...attachments };
								delete copy[change.doc.id];
								return copy;
							});
							break;

						case "added":
						case "modified":
							attachments.update(attachments => {
								const copy = { ...attachments };
								copy[change.doc.id] = attachmentFromSnapshot(change.doc, dek);
								return copy;
							});
							break;
					}
				});
			},
			error => {
				loadError.set(error);
				const watcher = get(attachmentsWatcher);
				if (watcher) watcher();
				attachmentsWatcher.set(null);
				console.error(error);
			}
		)
	);
}

export async function createAttachmentFromFile(file: File): Promise<Attachment> {
	const metadata = {
		type: file.type,
		title: file.name,
		notes: null,
		createdAt: new Date(),
	};
	return await createAttachment(metadata, file);
}

export async function createAttachment(
	record: Omit<AttachmentRecordParams, "storagePath">,
	file: File
): Promise<Attachment> {
	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	const newAttachment = await _createAttachment(userId, file, record, dek);
	await updateUserStats();
	attachments.update(attachments => {
		const copy = { ...attachments };
		copy[newAttachment.id] = newAttachment;
		return copy;
	});
	return newAttachment;
}

export async function updateAttachment(attachment: Attachment, file?: File): Promise<void> {
	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	await _updateAttachment(userId, file ?? null, attachment, dek);
	await updateUserStats();
	attachments.update(attachments => {
		const copy = { ...attachments };
		copy[attachment.id] = attachment;
		return copy;
	});
}

export async function deleteAttachment(attachment: Attachment, batch?: WriteBatch): Promise<void> {
	const userId = get(uid);
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { allTransactions, removeAttachmentFromTransaction } = await import("./transactionsStore");

	// Remove this attachment from any transactions which reference it
	const relevantTransactions = get(allTransactions).filter(t =>
		t.attachmentIds.includes(attachment.id)
	);
	for (const ts of chunk(relevantTransactions, 500)) {
		const tBatch = writeBatch();
		await Promise.all(ts.map(t => removeAttachmentFromTransaction(attachment.id, t, tBatch)));
		await tBatch.commit();
	}

	await _deleteAttachment(userId, attachment, batch);
	attachments.update(attachments => {
		const copy = { ...attachments };
		delete copy[attachment.id];
		return copy;
	});
	await updateUserStats();
}

export async function deleteAllAttachments(): Promise<void> {
	for (const attachments of chunk(get(allAttachments), 500)) {
		const batch = writeBatch();
		await Promise.all(attachments.map(a => deleteAttachment(a, batch)));
		await batch.commit();
	}
}

export async function imageDataFromFile(
	file: Attachment,
	shouldCache: boolean = true
): Promise<string> {
	// If we already have the thing, don't redownload
	const extantData = get(files)[file.id];
	if (extantData !== undefined && extantData) return extantData;

	const userId = get(uid);
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N
	if (userId === null) throw new Error("Sign in first"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	const imageData = await embeddableDataForFile(dek, file);

	if (shouldCache) {
		// Cache the data URL and its file
		files.update(files => {
			const copy = { ...files };
			copy[file.id] = imageData;
			return copy;
		});
	}

	return imageData;
}

export async function getAllAttachmentsAsJson(): Promise<Array<AttachmentSchema>> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = attachmentsCollection();
	const snap = await getDocs<AttachmentRecordPackage>(collection);
	return snap.docs
		.map(doc => attachmentFromSnapshot(doc, dek))
		.map(t => ({ ...recordFromAttachment(t), id: t.id }));
}

export async function importAttachment(
	attachmentToImport: AttachmentSchema,
	zip: Array<ZipEntry> | null
): Promise<void> {
	const storedAttachment = get(attachments)[attachmentToImport.id];

	const path = `accountable/storage/${attachmentToImport.storagePath.split(".")[0] as string}/${
		attachmentToImport.title
	}`;
	const fileRef = zip?.find(f => f.filename === path) ?? null;
	if (!fileRef?.getData) {
		console.warn(`No file found in zip with path ${path}`);
		return; // no blob? leave the reference broken.
	}

	const blobToImport = (await fileRef?.getData(new BlobWriter())) as Blob;
	const fileToImport = new File([blobToImport], attachmentToImport.title.trim(), {
		type: attachmentToImport.type?.trim(),
	});

	if (storedAttachment) {
		// If duplicate, overwrite the one we have
		const newAttachment = attachment({ ...storedAttachment, ...attachmentToImport });
		await updateAttachment(newAttachment, fileToImport);
	} else {
		// If new, create a new attachment
		const params: AttachmentRecordParams = {
			createdAt: attachmentToImport.createdAt,
			storagePath: attachmentToImport.storagePath,
			title: attachmentToImport.title.trim(),
			type: attachmentToImport.type?.trim() ?? "unknown",
			notes: attachmentToImport.notes?.trim() ?? null,
		};
		const newAttachment = await createAttachment(params, fileToImport);

		const { allTransactions, getAllTransactions, updateTransaction } = await import(
			"./transactionsStore"
		);
		// Assume we've imported all transactions,
		// but don't assume we have them cached yet
		await getAllTransactions();

		for (const transaction of get(allTransactions)) {
			if (!transaction.attachmentIds.includes(attachmentToImport.id)) continue;

			// Update the transaction with new attachment ID
			removeAttachmentIdFromTransaction(transaction, attachmentToImport.id);
			addAttachmentToTransaction(transaction, newAttachment);
			await updateTransaction(transaction);
		}
	}
}

export async function importAttachments(
	data: Array<AttachmentSchema>,
	zip: Array<ZipEntry> | null
): Promise<void> {
	await Promise.all(data.map(a => importAttachment(a, zip)));
}
