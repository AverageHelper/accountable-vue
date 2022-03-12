<script setup lang="ts">
import Checkbox from "../../components/inputs/Checkbox.vue";
import ListItem from "../../components/ListItem.vue";
import LocationIcon from "../../icons/Location.vue";
import PaperclipIcon from "../../icons/Paperclip.vue";
import { computed, ref, toRefs, onMounted } from "vue";
import { intlFormat, toTimestamp } from "../../transformers";
import { isNegative as isDineroNegative } from "dinero.js";
import { Transaction } from "../../model/Transaction";
import { useAttachmentsStore, useTransactionsStore, useUiStore } from "../../store";

const props = defineProps({
	transaction: { type: Transaction, required: true },
});
const { transaction } = toRefs(props);

const attachments = useAttachmentsStore();
const transactions = useTransactionsStore();
const ui = useUiStore();

const isChangingReconciled = ref(false);
const isNegative = computed(() => isDineroNegative(transaction.value.amount));
const hasAttachments = computed(() => transaction.value.attachmentIds.length > 0);
const isAttachmentBroken = ref<boolean | "unknown">("unknown");
const hasLocation = computed(() => transaction.value.locationId !== null);
const timestamp = computed(() => toTimestamp(transaction.value.createdAt));

const transactionRoute = computed(
	() => `/accounts/${transaction.value.accountId}/transactions/${transaction.value.id}`
);

function seeIfAnyAttachmentsAreBroken() {
	if (isAttachmentBroken.value !== "unknown") return;
	const attachmentIds = transaction.value.attachmentIds;

	// Check if an attachment is broken
	for (const id of attachmentIds) {
		const file = attachments.items[id];
		if (!file) {
			isAttachmentBroken.value = true;
			return;
		}
	}

	isAttachmentBroken.value = false;
}

onMounted(() => {
	seeIfAnyAttachmentsAreBroken();
});

async function markReconciled(isReconciled: boolean) {
	isChangingReconciled.value = true;

	try {
		const newTransaction = transaction.value.updatedWith({ isReconciled });
		await transactions.updateTransaction(newTransaction);
	} catch (error: unknown) {
		ui.handleError(error);
	}

	isChangingReconciled.value = false;
}
</script>

<template>
	<ListItem
		:to="transactionRoute"
		:title="transaction.title ?? '--'"
		:subtitle="timestamp"
		:count="intlFormat(transaction.amount)"
		:negative="isNegative"
	>
		<template #icon>
			<div class="checkbox">
				<Checkbox
					:disabled="isChangingReconciled"
					:class="{ isChanging: isChangingReconciled }"
					:model-value="transaction.isReconciled"
					@update:modelValue="markReconciled"
					@click.stop.prevent
				/>
				<span v-if="isChangingReconciled" class="loading" style="min-height: 33pt">...</span>
			</div>
		</template>

		<template #aside>
			<div class="indicators">
				<div v-if="hasLocation" :title="transaction.locationId ?? ''">
					<LocationIcon />
				</div>
				<div
					v-if="hasAttachments"
					:title="`${transaction.attachmentIds.length} attachment${
						transaction.attachmentIds.length === 1 ? '' : 's'
					}`"
				>
					<strong v-if="isAttachmentBroken">?</strong>
					<PaperclipIcon />
				</div>
			</div>
		</template>
	</ListItem>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.checkbox {
	position: relative;

	.isChanging {
		opacity: 0;
	}

	.loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-75%, -35%);
	}
}

.indicators {
	display: flex;
	flex-flow: row wrap;
	color: color($secondary-label);

	:not(:last-child) {
		margin-bottom: 2pt;
	}
}
</style>
