<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import type { PropType } from "vue";
import ActionButton from "./ActionButton.vue";
import DownloadIcon from "../../icons/Download.vue";
import { computed, toRefs } from "vue";
import { downloadFileAtUrl } from "../../transport";
import { useAttachmentsStore } from "../../store";

const props = defineProps({
	file: { type: Object as PropType<Attachment>, required: true },
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
		<span>{{ $t("common.download-action") }}</span>
	</ActionButton>
</template>

<style scoped lang="scss">
.icon {
	margin-right: 6pt;
}
</style>
