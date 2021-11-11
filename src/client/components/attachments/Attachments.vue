<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import List from "../List.vue";
import { computed } from "vue";
import { useAttachmentsStore, useTransactionsStore } from "../../store";

const attachments = useAttachmentsStore();
const transactions = useTransactionsStore();

const files = computed(() => attachments.allAttachments);

function referencesToFile(file: Attachment): number {
	return transactions.allTransactions.filter(t => t.attachmentIds.includes(file.id)).length;
}
</script>

<template>
	<p>To add a file, attach it to a transaction.</p>

	<List>
		<li v-for="file in files" :key="file.id">
			<span>{{ file.title }}</span>
			<span>{{ referencesToFile(file) }}</span>
		</li>
	</List>
</template>
