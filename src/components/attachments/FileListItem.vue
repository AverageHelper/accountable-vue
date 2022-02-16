<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import FileView from "./FileView.vue";
import ListItem from "../ListItem.vue";
import Modal from "../Modal.vue";
import { ref, computed, toRefs } from "vue";
import { toTimestamp } from "../../filters";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	fileId: { type: String, required: true },
});
const { fileId } = toRefs(props);

const emit = defineEmits(["delete", "delete-reference", "click"]);

const attachments = useAttachmentsStore();

const file = computed(() => attachments.items[fileId.value]);
const title = computed<string>(() => file.value?.title ?? fileId.value);
const subtitle = computed<string>(() => {
	if (!file.value) return "Broken reference";

	const timestamp = toTimestamp(file.value.createdAt);

	if (file.value.notes === null || !file.value.notes) {
		return timestamp;
	}
	return `${file.value.notes} - ${timestamp}`;
});

const isModalOpen = ref(false);

function presentImageModal(event: Event) {
	emit("click", event);
	isModalOpen.value = true;
}

function closeModal() {
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
	<ListItem :title="title" :subtitle="subtitle" to="" @click.prevent="presentImageModal" />
	<Modal :open="isModalOpen && !!file" :close-modal="closeModal">
		<FileView :file="file" @delete="askToDelete" @delete-reference="askToDeleteReference" />
	</Modal>
</template>
