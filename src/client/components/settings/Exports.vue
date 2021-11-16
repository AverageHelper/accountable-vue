<script setup lang="ts">
import type { AttachmentsDownloadable } from "../../store";
import ActionButton from "../ActionButton.vue";
import JSZip from "jszip";
import { asyncMap, dataUriToBlob, downloadFileAtUrl } from "../../transport";
import { ref } from "vue";
import { useAttachmentsStore, useAuthStore } from "../../store";
import { useToast } from "vue-toastification";
import { Attachment } from "../../model/Attachment";
import btoa from "btoa-lite";

const auth = useAuthStore();
const attachments = useAttachmentsStore();
const toast = useToast();

const isLoading = ref(false);

async function downloadStuff(shouldMinify: boolean) {
	isLoading.value = true;
	try {
		const zip = new JSZip();
		const root = zip.folder("accountable");
		if (!root) throw new Error("Zip failed, not sure why. Try again maybe?");

		// Prepare database
		const rawData = await auth.getAllUserDataAsJson();
		const data = JSON.stringify(rawData, undefined, shouldMinify ? undefined : "\t");
		const encodedData = btoa(data);
		root.file(`database${shouldMinify ? "-raw" : ""}.json`, encodedData, {
			base64: true,
		});

		// Prepare attachments
		const filesToGet: AttachmentsDownloadable = [];
		rawData.accounts.forEach(acct => {
			filesToGet.push(...acct.attachments);
		});
		const filesGotten: Array<[Attachment, string]> = await asyncMap(filesToGet, async a => {
			const file = new Attachment(a.id, a.storagePath, a);
			// FIXME: We may run out of memory here. Test with many files totaling more than 1 GB
			const data = await attachments.imageDataFromFile(file, false);
			return [file, data];
		});
		// mirror the storage bucket layout
		const userFiles =
			filesGotten.length > 0
				? root.folder("storage")?.folder("users")?.folder(rawData.uid)?.folder("attachments")
				: null;
		filesGotten.forEach(([f, d]) => {
			const mystifiedName = f.storagePath.slice(Math.max(0, f.storagePath.lastIndexOf("/") + 1));
			const imageFolder = userFiles?.folder(mystifiedName);
			const image = dataUriToBlob(d);
			imageFolder?.file(f.title, image);
		});

		// Zip them up
		const content = await zip.generateAsync({ type: "base64" });
		downloadFileAtUrl(
			`data:application/zip;base64,${encodeURIComponent(content)}`,
			"accountable.zip"
		);
	} catch (error: unknown) {
		let message: string;
		if (error instanceof Error) {
			message = error.message;
		} else {
			message = JSON.stringify(error);
		}
		toast.error(message);
		console.error(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent>
		<h3>Export</h3>
		<p
			>Exports an <strong>unencrypted</strong> copy of all your data in JSON format. (Except
			attachments of course, those will come as Accountable got them).</p
		>
		<p v-if="false"
			>This export might get big, and about 1/3 of it is spacing to make the JSON more
			human-readable. If you don't care about that, then we can just export the raw JSON data as
			small as we can make it.</p
		>
		<div class="buttons">
			<ActionButton
				kind="bordered"
				:disabled="isLoading"
				@click.prevent="() => downloadStuff(false)"
				>Export Everything</ActionButton
			>
			<ActionButton
				v-if="false"
				kind="bordered"
				:disabled="isLoading"
				@click.prevent="() => downloadStuff(true)"
				>Export Everything</ActionButton
			>
			<ActionButton
				v-if="false"
				kind="bordered"
				:disabled="isLoading"
				@click.prevent="() => downloadStuff(false)"
				>Export Everything with nice spacing</ActionButton
			>
		</div>
	</form>
</template>

<style scoped lang="scss">
p {
	margin-bottom: 0;
}

.buttons {
	display: flex;
	flex-flow: row wrap;

	:not(:last-child) {
		margin-right: 8pt;
	}
}
</style>
