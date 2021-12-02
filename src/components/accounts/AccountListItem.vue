<script setup lang="ts">
import type { PropType } from "vue";
import type { Transaction } from "../../model/Transaction";
import ListItem from "../ListItem.vue";
import { Account } from "../../model/Account";
import { computed, toRefs, onMounted } from "vue";
import { useTransactionsStore } from "../../store";

const props = defineProps({
	account: { type: Account, required: true },
	link: { type: Boolean, default: true },
	count: { type: Number as PropType<number | null>, default: null },
});
const { account, link, count } = toRefs(props);

const transactions = useTransactionsStore();
const accountRoute = computed(() => (link.value ? `/accounts/${account.value.id}` : "#"));
const theseTransactions = computed(
	() => transactions.transactionsForAccount[account.value.id] as Dictionary<Transaction> | undefined
);

const numberOfTransactions = computed<number | null>(() => {
	if (theseTransactions.value === undefined) {
		return count.value ?? null;
	}
	return count.value ?? Object.keys(theseTransactions.value).length;
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
