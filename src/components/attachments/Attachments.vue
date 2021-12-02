<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import ConfirmDestroyFile from "./ConfirmDestroyFile.vue";
import FileListItem from "./FileListItem.vue";
import List from "../List.vue";
import { ref, computed } from "vue";
import { useAttachmentsStore, useUiStore } from "../../store";

const attachments = useAttachmentsStore();
const ui = useUiStore();

const files = computed(() => attachments.allAttachments);
const numberOfFiles = computed(() => files.value.length);

const fileToDelete = ref<Attachment | null>(null);

function askToDeleteFile(file: Attachment) {
	fileToDelete.value = file;
}

async function confirmDeleteFile(file: Attachment) {
	try {
		await attachments.deleteAttachment(file);
	} catch (error: unknown) {
		ui.handleError(error);
	} finally {
		fileToDelete.value = null;
	}
}

function cancelDeleteFile() {
	fileToDelete.value = null;
}
</script>

<template>
	<div class="heading">
		<h1>Files</h1>
		<p>To add a file, attach it to a transaction.</p>
	</div>

	<List>
		<li v-for="file in files" :key="file.id">
			<FileListItem :file-id="file.id" @delete="askToDeleteFile" />
		</li>
		<li v-if="numberOfFiles > 0">
			<p class="footer">{{ numberOfFiles }} file<span v-if="numberOfFiles !== 1">s</span></p>
		</li>
	</List>

	<ConfirmDestroyFile
		:file="fileToDelete"
		:is-open="fileToDelete !== null"
		@yes="confirmDeleteFile"
		@no="cancelDeleteFile"
	/>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.heading {
	max-width: 36em;
	margin: 1em auto;

	> h1 {
		margin: 0;
	}
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
