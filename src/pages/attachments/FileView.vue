<script setup lang="ts">
import type { Attachment } from "../../model/Attachment";
import type { PropType } from "vue";
import ActionButton from "../../components/buttons/ActionButton.vue";
import DownloadButton from "../../components/buttons/DownloadButton.vue";
import ErrorNotice from "../../components/ErrorNotice.vue";
import List from "../../components/List.vue";
import TransactionListItem from "../transactions/TransactionListItem.vue";
import TrashIcon from "../../icons/Trash.vue";
import { ref, computed, watch, toRefs } from "vue";
import { toTimestamp } from "../../transformers";
import { useAttachmentsStore, useTransactionsStore } from "../../store";

const props = defineProps({
	file: { type: Object as PropType<Attachment | null>, default: null },
});
const { file } = toRefs(props);

const emit = defineEmits(["delete", "delete-reference"]);

const attachments = useAttachmentsStore();
const transactions = useTransactionsStore();

const imageUrl = ref<string | null>(null);
const imageLoadError = ref<Error | null>(null);
const linkedTransactions = computed(() =>
	transactions.allTransactions.filter(
		t => file.value !== null && t.attachmentIds.includes(file.value?.id)
	)
);
const transactionCount = computed(() => linkedTransactions.value.length);
const timestamp = computed(() => {
	if (!file.value) return "now";
	return toTimestamp(file.value.createdAt);
});

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
			} catch (error) {
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
	<div class="main">
		<!-- TODO: I18N -->
		<p v-if="!file">This file does not exist. Sorry.</p>
		<ErrorNotice v-else-if="imageLoadError" :error="imageLoadError" />
		<p v-else-if="!imageUrl">Loading...</p>
		<img v-else :src="imageUrl" />
	</div>

	<div>
		<p v-if="file"
			>Name: <strong>{{ file.title }}</strong></p
		>
		<p v-if="file"
			>Type: <strong>{{ file.type }}</strong></p
		>
		<p v-if="file"
			>Timestamp: <strong>{{ timestamp }}</strong></p
		>
	</div>

	<div v-if="transactionCount > 0">
		<h3>Linked Transaction{{ transactionCount !== 1 ? "s" : "" }}</h3>
		<List class="files">
			<li v-for="transaction in linkedTransactions" :key="transaction.id">
				<TransactionListItem :transaction="transaction" />
			</li>
		</List>
	</div>

	<h3>Actions</h3>
	<div class="buttons">
		<DownloadButton v-if="file" class="download" :file="file" />

		<ActionButton
			v-if="file"
			class="delete"
			kind="bordered-destructive"
			@click.prevent="askToDelete"
		>
			<TrashIcon /> Delete</ActionButton
		>
		<ActionButton v-else class="delete" kind="bordered" @click.prevent="askToDelete">
			<TrashIcon /> Remove this dead reference</ActionButton
		>
	</div>
</template>

<style scoped lang="scss">
.main {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	justify-content: center;
	margin-bottom: 1em;

	img {
		max-width: 100%;
	}
}

.files {
	> li {
		overflow: hidden;
		border-radius: 4pt;
	}
}

.buttons {
	display: flex;
	flex-flow: row nowrap;

	> button {
		margin-top: 0;
	}

	> .download {
		margin-right: 8pt;
	}

	> .delete {
		margin-left: auto;

		.icon {
			margin-right: 6pt;
		}
	}
}
</style>
