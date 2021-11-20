<script setup lang="ts">
import Checkbox from "../Checkbox.vue";
import PaperclipIcon from "../../icons/Paperclip.vue";
import { computed, ref, toRefs } from "vue";
import { isNegative as isDineroNegative } from "dinero.js";
import { Transaction } from "../../model/Transaction";
import { intlFormat } from "../../filters/toCurrency";
import { useTransactionsStore, useUiStore } from "../../store";

const props = defineProps({
	transaction: { type: Transaction, required: true },
});
const { transaction } = toRefs(props);

const transactions = useTransactionsStore();
const ui = useUiStore();

const isChangingReconciled = ref(false);
const isNegative = computed(() => isDineroNegative(transaction.value.amount));
const hasAttachments = computed(() => transaction.value.attachmentIds.length > 0);
const timestamp = computed(() => {
	const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
	return formatter.format(transaction.value.createdAt);
});

const transactionRoute = computed(
	() => `/accounts/${transaction.value.accountId}/transactions/${transaction.value.id}`
);

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
			<PaperclipIcon v-if="hasAttachments" class="has-attachments" />
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
		margin-left: auto;

		.has-attachments {
			position: relative;
			top: -1pt;
			margin-left: auto;
			color: color($secondary-label);
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
