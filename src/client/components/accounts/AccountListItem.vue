<script setup lang="ts">
import type { Transaction } from "../../model/Transaction";
import ListItem from "../ListItem.vue";
import { Account } from "../../model/Account";
import { computed, toRefs, onMounted } from "vue";
import { useTransactionsStore } from "../../store";

const props = defineProps({
	account: { type: Account, required: true },
	link: { type: Boolean, default: true },
});
const { account, link } = toRefs(props);

const transactions = useTransactionsStore();
const accountRoute = computed(() => (link.value ? `/accounts/${account.value.id}` : "#"));
const theseTransactions = computed(
	() => transactions.transactionsForAccount[account.value.id] as Dictionary<Transaction> | undefined
);

const numberOfTransactions = computed<number | null>(() => {
	if (theseTransactions.value === undefined) {
		return null;
	}
	return Object.keys(theseTransactions.value).length;
});

onMounted(async () => {
	if (theseTransactions.value === undefined) {
		await transactions.getTransactionsForAccount(account.value);
	}
});
</script>

<template>
	<ListItem
		:to="accountRoute"
		:title="account.title"
		:subtitle="account.notes"
		:count="numberOfTransactions"
	/>
</template>
