<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import type { Transaction } from "../../model/Transaction";
import type { PropType } from "vue";
import FileInput from "./FileInput.vue";
import FileListItem from "./FileListItem.vue";
import List from "../../components/List.vue";
import ListItem from "../../components/ListItem.vue";
import { useAttachmentsStore, useTransactionsStore, useUiStore } from "../../store";
import { computed, toRefs } from "vue";

const emit = defineEmits(["close"]);

const props = defineProps({
	transaction: { type: Object as PropType<Transaction>, required: true },
	fileId: { type: String, required: true },
});
const { transaction, fileId } = toRefs(props);

const attachments = useAttachmentsStore();
const transactions = useTransactionsStore();
const ui = useUiStore();

const files = computed(() => attachments.allAttachments);
const numberOfFiles = computed(() => files.value.length);

async function selectNewFile(attachment: Attachment) {
	const newTransaction = transaction.value.copy();
	newTransaction.addAttachmentId(attachment.id);
	newTransaction.removeAttachmentId(fileId.value);
	await transactions.updateTransaction(newTransaction);
	emit("close");
}

async function createNewFile(file: File | null): Promise<void> {
	if (!file) return;

	try {
		const attachment = await attachments.createAttachmentFromFile(file);
		await selectNewFile(attachment);
	} catch (error) {
		ui.handleError(error);
	}
}
</script>

<template>
	<div>
		<!-- TODO: I18N -->
		<h3>Fix broken reference</h3>
		<p
			>This attachment somehow got lost in the mix, possibly due to an import bug. Select the
			correct file below:</p
		>

		<List>
			<li>
				<FileInput @input="createNewFile">
					<template #default="{ click }">
						<ListItem title="Upload a file" to="" @click.prevent="click" />
					</template>
				</FileInput>
			</li>
			<li v-for="file in files" :key="file.id">
				<FileListItem :file-id="file.id" @click.prevent="() => selectNewFile(file)" />
			</li>
			<li v-if="numberOfFiles > 0">
				<p class="footer">{{ numberOfFiles }} file<span v-if="numberOfFiles !== 1">s</span></p>
			</li>
		</List>
	</div>
</template>
