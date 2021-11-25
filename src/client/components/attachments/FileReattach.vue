<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import type { Transaction } from "../../model/Transaction";
import type { PropType } from "vue";
import FileListItem from "./FileListItem.vue";
import List from "../List.vue";
import { useAttachmentsStore, useTransactionsStore } from "../../store";
import { computed, toRefs } from "vue";

const emit = defineEmits(["close"]);

const props = defineProps({
	transaction: { type: Object as PropType<Transaction>, required: true },
	fileId: { type: String, required: true },
});
const { transaction, fileId } = toRefs(props);

const attachments = useAttachmentsStore();
const transactions = useTransactionsStore();

const files = computed(() => attachments.allAttachments);
const numberOfFiles = computed(() => files.value.length);

async function selectNewFile(file: Attachment) {
	const newTransaction = transaction.value.copy();
	newTransaction.addAttachmentId(file.id);
	newTransaction.removeAttachmentId(fileId.value);
	await transactions.updateTransaction(newTransaction);
	emit("close");
}
</script>

<template>
	<div>
		<h3>Fix broken reference</h3>
		<p
			>This attachment somehow got lost in the mix, possibly due to an import bug. Select the
			correct file below:</p
		>

		<List>
			<li v-for="file in files" :key="file.id">
				<FileListItem :file-id="file.id" @click.prevent="() => selectNewFile(file)" />
			</li>
			<li v-if="numberOfFiles > 0">
				<p class="footer">{{ numberOfFiles }} file<span v-if="numberOfFiles !== 1">s</span></p>
			</li>
		</List>
	</div>
</template>
