<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import FileView from "./FileView.vue";
import ListItem from "../ListItem.vue";
import Modal from "../Modal.vue";
import { ref, computed, toRefs } from "vue";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	fileId: { type: String, required: true },
});
const { fileId } = toRefs(props);

const emit = defineEmits(["delete", "delete-reference"]);

const attachments = useAttachmentsStore();

const file = computed(() => attachments.items[fileId.value]);
const title = computed<string>(() => file.value?.title ?? fileId.value);
const subtitle = computed<string>(() => {
	if (!file.value) return "";
	const timestamp = file.value.createdAt.toString();

	if (file.value.notes === null || !file.value.notes) {
		return timestamp;
	}
	return `${file.value.notes} - ${timestamp}`;
});

const isModalOpen = ref(false);

function presentImageModal() {
	isModalOpen.value = true;
}

function closeImageModal() {
	isModalOpen.value = false;
}

function askToDelete(file: Attachment) {
	emit("delete", file);
}

function askToDeleteReference() {
	emit("delete-reference", fileId.value);
}
</script>

<template>
	<ListItem to="" :title="title" :subtitle="subtitle" @click.stop.prevent="presentImageModal" />
	<Modal :open="isModalOpen" :close-modal="closeImageModal">
		<FileView :file="file" @delete="askToDelete" @delete-reference="askToDeleteReference" />
	</Modal>
</template>
