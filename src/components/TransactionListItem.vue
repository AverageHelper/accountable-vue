<script setup lang="ts">
import Checkbox from "./Checkbox.vue";
import { computed, ref, toRefs } from "vue";
import { Transaction } from "../model/Transaction";
import { toCurrency } from "../filters/toCurrency";
import { useTransactionsStore } from "../store";
import { useToast } from "vue-toastification";

const props = defineProps({
	transaction: { type: Transaction, required: true },
});
const { transaction } = toRefs(props);

const transactions = useTransactionsStore();
const toast = useToast();

const isNegative = computed(() => transaction.value.amount < 0);
const isChangingReconciled = ref(false);

const transactionRoute = computed(
	() => `/accounts/${transaction.value.accountId}/transactions/${transaction.value.id}`
);

function handleError(error: unknown) {
	let message: string;
	if (error instanceof Error) {
		message = error.message;
	} else {
		message = JSON.stringify(error);
	}
	toast.error(message);
	console.error(error);
}

async function markReconciled(isReconciled: boolean) {
	isChangingReconciled.value = true;

	try {
		const newTransaction = transaction.value.updatedWith({ isReconciled });
		await transactions.updateTransaction(newTransaction);
	} catch (error: unknown) {
		handleError(error);
	}

	isChangingReconciled.value = false;
}
</script>

<template>
	<router-link class="transaction-list-item" :to="transactionRoute">
		<Checkbox
			:disabled="isChangingReconciled"
			:model-value="transaction.isReconciled"
			@update:modelValue="markReconciled"
		/>
		<span class="title">{{ transaction.title }}</span>
		<span class="amount" :class="{ negative: isNegative }">{{
			toCurrency(transaction.amount)
		}}</span>
	</router-link>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.transaction-list-item {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	justify-content: space-between;
	padding: 0.75em;
	margin-bottom: 0.5em;
	text-decoration: none;
	color: color($label);
	background-color: color($secondary-fill);

	.title {
		font-weight: bold;
	}

	.amount {
		font-weight: bold;

		&.negative {
			color: color($red);
		}
	}
}
</style>
