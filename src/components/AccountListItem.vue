<script setup lang="ts">
import type { Transaction } from "../model/Transaction";
import { Account } from "../model/Account";
import { computed, toRefs, onMounted } from "vue";
import { useTransactionsStore } from "../store";

const props = defineProps({
	account: { type: Account, required: true },
});
const { account } = toRefs(props);

const transactions = useTransactionsStore();
const accountRoute = computed(() => `/accounts/${account.value.id}`);
const theseTransactions = computed<Dictionary<Transaction> | undefined>(
	() => transactions.transactionsForAccount[account.value.id]
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
	<router-link class="account-list-item" :to="accountRoute">
		<div class="content">
			<span class="title">{{ account.title }}</span>
			<span v-if="account.notes" class="subtitle">{{ account.notes }}</span>
		</div>

		<span v-if="numberOfTransactions === null">...</span>
		<span v-else class="count">{{ numberOfTransactions }}</span>
	</router-link>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.account-list-item {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	justify-content: space-between;
	padding: 0.75em;
	margin-bottom: 0.5em;
	text-decoration: none;
	color: color($label);
	background-color: color($cloud);

	.content {
		display: flex;
		flex-direction: column;

		.title {
			font-weight: bold;
		}

		.subtitle {
			color: color($secondary-label);
		}
	}

	.count {
		font-weight: bold;
		background-color: color($gray);
		color: color($inverse-label);
		border-radius: 1em;
		padding: 0 0.5em;
		min-width: 1em;
		text-align: center;
	}
}
</style>
