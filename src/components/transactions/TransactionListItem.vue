<script setup lang="ts">
import Checkbox from "../Checkbox.vue";
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
	<router-link class="transaction-list-item" :to="transactionRoute">
		<Checkbox
			v-if="!isChangingReconciled"
			class="checkbox"
			:model-value="transaction.isReconciled"
			@update:modelValue="markReconciled"
			@click.stop.prevent
		/>
		<span v-else style="min-height: 33pt">...</span>

		<div class="labels">
			<span class="title">{{ transaction.title }}</span>
			<span class="timestamp">{{ timestamp }}</span>
		</div>

		<div class="tail">
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
			<span class="amount" :class="{ negative: isNegative }">{{
				intlFormat(transaction.amount)
			}}</span>
		</div>
	</router-link>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.transaction-list-item {
	position: relative;
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	border-radius: 0;
	padding: 0.75em;
	text-decoration: none;
	color: color($label);
	background-color: color($secondary-fill);

	@media (hover: hover) {
		&:hover {
			background-color: color($gray4);
		}
	}

	.labels {
		display: flex;
		flex-flow: column nowrap;
		margin-left: 0.4em;

		.title {
			font-weight: bold;
		}

		.timestamp {
			font-size: small;
		}
	}

	.tail {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		margin-left: auto;

		> .indicators {
			display: flex;
			flex-flow: row wrap;
			color: color($secondary-label);
			margin-left: auto;

			:not(:last-child) {
				margin-bottom: 2pt;
			}
		}

		.amount {
			font-weight: bold;
			margin-left: 8pt;

			&.negative {
				color: color($red);
			}
		}
	}
}
</style>
