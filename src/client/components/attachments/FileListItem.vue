<script setup lang="ts">
import Modal from "../Modal.vue";
import FileView from "./FileView.vue";
import ListItem from "../ListItem.vue";
import { Attachment } from "../../model/Attachment";
import { ref, computed, toRefs, onMounted } from "vue";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	file: { type: Attachment, required: true },
});
const { file } = toRefs(props);

const attachments = useAttachmentsStore();

const subtitle = computed(() => {
	const timestamp = file.value.createdAt.toString();

	if (file.value.notes === null || !file.value.notes) {
		return timestamp;
	}
	return `${file.value.notes} - ${timestamp}`;
});

const imageUrl = ref<string | null>(null);
const imageLoadError = ref<Error | null>(null);
const isModalOpen = ref(false);

onMounted(async () => {
	try {
		imageUrl.value = await attachments.imageDataFromFile(file.value);
	} catch (error: unknown) {
		imageLoadError.value = error as Error;
	}
});

function presentImageModal() {
	isModalOpen.value = true;
}

function closeImageModal() {
	isModalOpen.value = false;
}
</script>

<template>
	<ListItem
		to=""
		:title="file.title"
		:subtitle="subtitle"
		@click.stop.prevent="presentImageModal"
	/>
	<Modal :open="isModalOpen" :close-modal="closeImageModal">
		<FileView :file="isModalOpen ? file : null" />
	</Modal>
</template>
