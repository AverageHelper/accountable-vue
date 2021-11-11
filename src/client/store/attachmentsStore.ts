import type { Attachment, AttachmentRecordParams } from "../model/Attachment";
import type { HashStore } from "../transport";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";
import {
	attachmentsCollection,
	createAttachment,
	deleteAttachment,
	deriveDEK,
	embeddableDataForFile,
	updateAttachment,
	attachmentFromSnapshot,
	watchAllRecords,
} from "../transport";

export const useAttachmentsStore = defineStore("attachments", {
	state: () => ({
		items: {} as Dictionary<Attachment>, // Attachment.id -> Attachment
		files: {} as Dictionary<string>, // Attachment.id -> image data URL
		loadError: null as Error | null,
		attachmentsWatcher: null as Unsubscribe | null,
	}),
	getters: {
		allAttachments(state): Array<Attachment> {
			return Object.values(state.items);
		},
	},
	actions: {
		clearCache() {
			if (this.attachmentsWatcher) {
				this.attachmentsWatcher();
				this.attachmentsWatcher = null;
			}
			this.files = {};
			this.items = {};
			this.loadError = null;
			console.log("attachmentsStore: cache cleared");
		},
		watchAttachments(force: boolean = false) {
			if (this.attachmentsWatcher && !force) return;

			if (this.attachmentsWatcher) {
				this.attachmentsWatcher();
				this.attachmentsWatcher = null;
			}

			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const collection = attachmentsCollection(uid);
			this.attachmentsWatcher = watchAllRecords(
				collection,
				async snap => {
					this.loadError = null;
					const authStore = useAuthStore();
					const { dekMaterial } = await authStore.getDekMaterial();
					const dek = deriveDEK(pKey, dekMaterial);

					snap.docChanges().forEach(change => {
						switch (change.type) {
							case "removed":
								delete this.items[change.doc.id];
								break;

							case "added":
							case "modified":
								this.items[change.doc.id] = attachmentFromSnapshot(change.doc, dek);
								break;
						}
					});
				},
				error => {
					this.loadError = error;
				}
			);
		},
		async createAttachment(
			record: Omit<AttachmentRecordParams, "storagePath">,
			file: File
		): Promise<Attachment> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			return await createAttachment(uid, file, record, dek);
		},
		async updateAttachment(attachment: Attachment): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateAttachment(uid, attachment, dek);
		},
		async deleteAttachment(attachment: Attachment): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			await deleteAttachment(uid, attachment);
		},
		async imageDataFromFile(file: Attachment): Promise<string> {
			// If we already have the thing, don't redownload
			const extantData = this.files[file.id];
			if (extantData !== undefined && extantData) return extantData;

			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const imageData = await embeddableDataForFile(dek, file);

			// Cache the data URL and its file
			this.files[file.id] = imageData;

			return imageData;
		},
	},
});
