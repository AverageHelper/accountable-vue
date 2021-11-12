<script setup lang="ts">
import type { Transaction } from "../../model/Transaction";
import AccountEdit from "./AccountEdit.vue";
import EditButton from "../EditButton.vue";
import List from "../List.vue";
import NavAction from "../NavAction.vue";
import NavTitle from "../NavTitle.vue";
import TransactionEdit from "../transactions/TransactionEdit.vue";
import TransactionListItem from "../transactions/TransactionListItem.vue";
import { computed, toRefs, watch } from "vue";
import { toCurrency } from "../../filters/toCurrency";
import { useAccountsStore, useTransactionsStore } from "../../store";
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
	const allTransactions = (transactions.transactionsForAccount[accountId.value] ??
		{}) as Dictionary<Transaction>;
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
	<NavTitle v-if="account">{{ account.title }}</NavTitle>

	<NavAction v-if="account">
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

	<List class="transactions-list">
		<li v-for="transaction in theseTransactions" :key="transaction.id" class="transaction">
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

.transactions-list {
	> .transaction {
		position: relative;
		overflow: hidden;

		&::after {
			content: "";
			display: block;
			position: absolute;
			bottom: 0;
			right: 0;
			width: 92%;
			height: 1pt;
			background-color: color($background);
			z-index: 100;
			user-select: none;
		}

		// Round the first and last bordered list items
		&:first-child {
			border-radius: 4pt 4pt 0 0;
		}

		&:nth-last-child(2) {
			border-radius: 0 0 4pt 4pt;

			&::after {
				display: none;
			}
		}
	}

	.footer {
		padding-top: 0.5em;
		user-select: none;
		color: color($secondary-label);
	}
}
</style>
