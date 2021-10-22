<script setup lang="ts">
import type { Transaction } from "../model/Transaction";
import AccountEdit from "./AccountEdit.vue";
import EditButton from "./EditButton.vue";
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import NavTitle from "./NavTitle.vue";
import TransactionEdit from "./TransactionEdit.vue";
import TransactionListItem from "./TransactionListItem.vue";
import { computed, toRefs, watch } from "vue";
import { toCurrency } from "../filters/toCurrency";
import { useAccountsStore, useTransactionsStore } from "../store";
import { useRouter } from "vue-router";

function reverseChronologically(this: void, a: Transaction, b: Transaction): number {
	return b.createdAt.getTime() - a.createdAt.getTime();
}

const props = defineProps({
	accountId: { type: String, required: true },
});
const { accountId } = toRefs(props);

const router = useRouter();
const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const account = computed(() => accounts.items[accountId.value]);
const theseTransactions = computed(() => {
	const allTransactions = transactions.transactionsForAccount[accountId.value] ?? {};
	return Object.values(allTransactions).sort(reverseChronologically);
});
const numberOfTransactions = computed(() => theseTransactions.value.length);

const remainingBalance = computed(() => accounts.currentBalance[accountId.value] ?? null);
const isNegative = computed(() => (remainingBalance.value ?? 0) < 0);

watch(
	account,
	account => {
		if (account) {
			transactions.watchTransactions(account);
		}
	},
	{ immediate: true }
);

function goBack() {
	router.back();
}
</script>

<template>
	<NavTitle>{{ account.title }}</NavTitle>

	<NavAction>
		<EditButton>
			<template #modal="{ onFinished }">
				<AccountEdit :account="account" @deleted="goBack" @finished="onFinished" />
			</template>
		</EditButton>
		<EditButton>
			<template #icon>
				<span>+</span>
			</template>
			<template #modal="{ onFinished }">
				<TransactionEdit :account="account" @finished="onFinished" />
			</template>
		</EditButton>
	</NavAction>

	<p v-if="remainingBalance === null" class="account-balance">--</p>
	<p v-else class="account-balance" :class="{ negative: isNegative }">{{
		toCurrency(remainingBalance)
	}}</p>

	<List>
		<li v-for="transaction in theseTransactions" :key="transaction.id">
			<TransactionListItem :transaction="transaction" />
		</li>
		<li>
			<p class="footer">
				<span>{{ numberOfTransactions }}</span> transaction<span v-if="numberOfTransactions !== 1"
					>s</span
				>
			</p>
		</li>
	</List>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.account-balance {
	margin: 1em auto;
	padding-right: 0.7em;
	max-width: 36em;
	text-align: right;
	font-weight: bold;

	&.negative {
		color: color($red);
	}
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
