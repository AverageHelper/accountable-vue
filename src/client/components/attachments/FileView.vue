<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import type { PropType } from "vue";
import ActionButton from "../ActionButton.vue";
import ErrorNotice from "../ErrorNotice.vue";
import { ref, watch, toRefs } from "vue";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	file: { type: Object as PropType<Attachment | null>, default: null },
});
const { file } = toRefs(props);

const emit = defineEmits(["delete", "delete-reference"]);

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

function askToDelete() {
	if (file.value) {
		emit("delete", file.value); // get rid of the file
	} else {
		emit("delete-reference"); // get rid of the file reference
	}
}
</script>

<template>
	<p v-if="!file">This file does not exist. Sorry.</p>
	<ErrorNotice v-else-if="imageLoadError" :error="imageLoadError" />
	<p v-else-if="!imageUrl">Loading...</p>
	<img v-else :src="imageUrl" />

	<p v-if="file">{{ file.title }}</p>
	<p v-if="file">{{ file.type }}</p>
	<p v-if="file">{{ file.createdAt.toString() }}</p>

	<ActionButton v-if="file" kind="bordered-destructive" @click.prevent="askToDelete"
		>Delete {{ file.title }}</ActionButton
	>
	<ActionButton v-else kind="bordered" @click.prevent="askToDelete"
		>Remove this dead reference</ActionButton
	>
</template>

<style scoped lang="scss">
img {
	max-width: 100%;
}
</style>
