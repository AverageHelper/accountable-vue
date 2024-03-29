<script setup lang="ts">
import type { PropType } from "vue";
import type { Transaction } from "../../model/Transaction";
import Checkbox from "../../components/inputs/Checkbox.vue";
import ListItem from "../../components/ListItem.vue";
import LocationIcon from "../../icons/Location.vue";
import PaperclipIcon from "../../icons/Paperclip.vue";
import { isNegative as isDineroNegative } from "dinero.js";
import { computed, onMounted, ref, toRefs } from "vue";
import { intlFormat, toTimestamp } from "../../transformers";
import { transaction as newTransaction } from "../../model/Transaction";
import { transactionPath } from "../../router";
import { useAttachmentsStore, useTransactionsStore, useUiStore } from "../../store";

const props = defineProps({
	transaction: { type: Object as PropType<Transaction>, required: true },
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

const accountBalanceSoFar = computed(() => {
	const allBalancesForAccount = transactions.allBalances[transaction.value.accountId] ?? {};
	return allBalancesForAccount[transaction.value.id] ?? null;
});

const transactionRoute = computed(() =>
	transactionPath(transaction.value.accountId, transaction.value.id)
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
		const newTxn = newTransaction(transaction.value);
		newTxn.isReconciled = isReconciled;
		await transactions.updateTransaction(newTxn);
	} catch (error) {
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
		:sub-count="accountBalanceSoFar ? intlFormat(accountBalanceSoFar) : '--'"
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
				<!-- TODO: I18N -->
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
