<script setup lang="ts">
import ListItem from "../ListItem.vue";
import { Attachment } from "../../model/Attachment";
import { computed, toRefs } from "vue";
import { useTransactionsStore } from "../../store";

const props = defineProps({
	file: { type: Attachment, required: true },
});
const { file } = toRefs(props);

const transactions = useTransactionsStore();

// const attachmentRoute = computed(() => `/attachments`);
const subtitle = computed(() => {
	const timestamp = file.value.createdAt.toString();

	if (file.value.notes === null || !file.value.notes) {
		return timestamp;
	}
	return `${file.value.notes} - ${timestamp}`;
});
const numberOfReferences = computed<number>(() => {
	const transactionsThatReferenceUs = transactions.allTransactions.filter(t =>
		t.attachmentIds.includes(file.value.id)
	);
	return transactionsThatReferenceUs.length;
});
</script>

<template>
	<ListItem :title="file.title" :subtitle="subtitle" :count="numberOfReferences" />
</template>
