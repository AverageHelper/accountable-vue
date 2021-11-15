<script setup lang="ts">
import ActionButton from "../ActionButton.vue";
import DownloadIcon from "../../icons/Download.vue";
import { Attachment } from "../../model/Attachment";
import { computed, toRefs } from "vue";
import { downloadFileAtUrl } from "../../transport";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	file: { type: Attachment, required: true },
});
const { file } = toRefs(props);

const attachments = useAttachmentsStore();

const imgUrl = computed(() => attachments.files[file.value.id] ?? null);

function startDownload() {
	const url = imgUrl.value;
	if (url === null || !url) return;

	downloadFileAtUrl(url, file.value.title);
}
</script>

<template>
	<ActionButton kind="bordered-primary" :disabled="imgUrl === null" @click.prevent="startDownload">
		<DownloadIcon />
		<span>Download</span>
	</ActionButton>
</template>

<style scoped lang="scss">
.icon {
	margin-right: 6pt;
}
</style>
