<script setup lang="ts">
import type { Transaction } from "../../model/Transaction";
import AccountEdit from "./AccountEdit.vue";
import AddTransactionListItem from "./AddTransactionListItem.vue";
import EditButton from "../EditButton.vue";
import List from "../List.vue";
import Modal from "../Modal.vue";
import NavAction from "../NavAction.vue";
import TransactionEdit from "../transactions/TransactionEdit.vue";
import TransactionListItem from "../transactions/TransactionListItem.vue";
import { ref, computed, toRefs, watch } from "vue";
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

const isEditingTransaction = ref(false);

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

function startCreatingTransaction() {
	isEditingTransaction.value = true;
}

function finishCreatingTransaction() {
	isEditingTransaction.value = false;
}
</script>

<template>
	<NavAction v-if="account">
		<EditButton>
			<template #modal="{ onFinished }">
				<AccountEdit :account="account" @deleted="goBack" @finished="onFinished" />
			</template>
		</EditButton>
	</NavAction>

	<div class="heading">
		<h1>{{ account?.title || "Account" }}</h1>

		<p v-if="remainingBalance === null" class="account-balance">--</p>
		<p v-else class="account-balance" :class="{ negative: isNegative }">{{
			toCurrency(remainingBalance)
		}}</p>
	</div>

	<List class="transactions-list">
		<li>
			<AddTransactionListItem class="list-item header" @click="startCreatingTransaction" />
		</li>
		<li
			v-for="transaction in theseTransactions"
			:key="transaction.id"
			class="list-item transaction"
		>
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

	<Modal v-if="account" :open="isEditingTransaction" :close-modal="finishCreatingTransaction">
		<TransactionEdit :account="account" @finished="finishCreatingTransaction" />
	</Modal>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.heading {
	display: flex;
	flex-flow: row nowrap;
	align-items: baseline;
	justify-content: space-between;
	max-width: 36em;
	margin: 1em auto;

	> h1 {
		margin: 0;
	}

	.account-balance {
		margin: 0;
		text-align: right;
		font-weight: bold;
		padding-right: 0.7em;

		&.negative {
			color: color($red);
		}
	}
}

.transactions-list {
	.header {
		border-radius: 0;
		margin-bottom: 0;
	}

	.list-item {
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
