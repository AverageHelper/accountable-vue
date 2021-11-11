<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import type { PropType } from "vue";
import ErrorNotice from "../ErrorNotice.vue";
import { ref, watch, toRefs } from "vue";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	file: { type: Object as PropType<Attachment | null>, default: null },
});
const { file } = toRefs(props);

const attachments = useAttachmentsStore();

const imageUrl = ref<string | null>(null);
const imageLoadError = ref<Error | null>(null);

watch(
	file,
	async file => {
		// Forget old value
		imageUrl.value = null;
		imageLoadError.value = null;

		// Load new data
		if (file) {
			try {
				imageUrl.value = await attachments.imageDataFromFile(file);
			} catch (error: unknown) {
				imageLoadError.value = error as Error;
			}
		}
	},
	{ immediate: true }
);
</script>

<template>
	<p v-if="!file">No file selected</p>
	<ErrorNotice v-else-if="imageLoadError" :error="imageLoadError" />
	<p v-else-if="!imageUrl">Loading...</p>
	<img v-else :src="imageUrl" />

	<p>{{ file?.title ?? "Untitled" }}</p>
	<p>{{ file?.type ?? "Unknown Type" }}</p>
	<p>{{ file?.createdAt.toString() ?? "Unknown date" }}</p>
</template>

<style scoped lang="scss">
img {
	max-width: 100%;
}
</style>
