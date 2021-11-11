<script setup lang="ts">
import FileListItem from "./FileListItem.vue";
import List from "../List.vue";
import { computed } from "vue";
import { useAttachmentsStore } from "../../store";

const attachments = useAttachmentsStore();

const files = computed(() => attachments.allAttachments);
const numberOfFiles = computed(() => files.value.length);
</script>

<template>
	<p>To add a file, attach it to a transaction.</p>

	<List>
		<li v-for="file in files" :key="file.id">
			<FileListItem :file="file" />
		</li>
		<li>
			<p class="footer">{{ numberOfFiles }} file<span v-if="numberOfFiles !== 1">s</span></p>
		</li>
	</List>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

p {
	text-align: center;
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
