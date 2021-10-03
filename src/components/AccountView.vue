<script setup lang="ts">
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import PlainButton from "./PlainButton.vue";
import TransactionListItem from "./TransactionListItem.vue";

import { computed, ref } from "vue";
import { Transaction } from "../model/Transaction";
import { useAccountsStore, useTransactionsStore } from "../store";

const props = defineProps({
	accountId: { type: String, required: true },
});

const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const theseTransactions = computed<Dictionary<Transaction> | undefined>(
	() => transactions.transactionsForAccount[props.accountId]
);
const numberOfTransactions = computed(() => Object.keys(theseTransactions.value ?? {}).length);
const isSaving = ref(false);

const account = computed(() => accounts.items[props.accountId]);

async function create() {
	isSaving.value = true;
	const newTransaction = new Transaction(props.accountId);
	try {
		await transactions.saveTransaction(newTransaction, account.value);
	} catch {
		// nop for now
	}
	isSaving.value = false;
}
</script>

<template>
	<NavAction>
		<PlainButton :disabled="isSaving" @click="create">
			<span>+</span>
		</PlainButton>
	</NavAction>

	<List>
		<li v-for="transaction in theseTransactions" :key="transaction.id">
			<TransactionListItem :transaction="transaction" />
		</li>
		<li>
			<p class="footer">
				{{ numberOfTransactions }} transaction<span v-if="numberOfTransactions !== 1">s</span>
			</p>
		</li>
	</List>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
