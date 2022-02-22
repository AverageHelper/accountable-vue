<script setup lang="ts">
import type { PropType } from "vue";
import type { Transaction } from "../../model/Transaction";
import ListItem from "../ListItem.vue";
import { Account } from "../../model/Account";
import { computed, toRefs, onMounted } from "vue";
import { intlFormat } from "../../transformers";
import { isNegative as isDineroNegative } from "dinero.js";
import { useAccountsStore, useTransactionsStore } from "../../store";

const props = defineProps({
	account: { type: Account, required: true },
	link: { type: Boolean, default: true },
	count: { type: Number as PropType<number | null>, default: null },
});
const { account, link, count } = toRefs(props);

const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const accountRoute = computed(() => (link.value ? `/accounts/${account.value.id}` : "#"));
const theseTransactions = computed(
	() => transactions.transactionsForAccount[account.value.id] as Dictionary<Transaction> | undefined
);

const remainingBalance = computed(() => accounts.currentBalance[account.value.id] ?? null);
const isBalanceNegative = computed(
	() => remainingBalance.value !== null && isDineroNegative(remainingBalance.value)
);
const numberOfTransactions = computed<number | null>(() => {
	if (theseTransactions.value === undefined) {
		return count.value ?? null;
	}
	return count.value ?? Object.keys(theseTransactions.value).length;
});
const subtitle = computed<string>(() => {
	const notes = account.value.notes?.trim() ?? "";
	const count = numberOfTransactions.value;
	const countString = `${count ?? "?"} transaction${count === 1 ? "" : "s"}`;

	if (!notes) return countString;
	if (count === null) return notes;
	return `${countString} - ${notes}`;
});

onMounted(async () => {
	await transactions.getTransactionsForAccount(account.value);
});
</script>

<template>
	<ListItem
		:to="accountRoute"
		:title="account.title"
		:subtitle="subtitle"
		:count="remainingBalance ? intlFormat(remainingBalance) : '--'"
		:negative="isBalanceNegative"
	/>
</template>
