<script setup lang="ts">
import type { Transaction } from "../../model/Transaction";
import AccountEdit from "./AccountEdit.vue";
import ActionButton from "../ActionButton.vue";
import AddTransactionListItem from "./AddTransactionListItem.vue";
import EditIcon from "../../icons/Edit.vue";
import Fuse from "fuse.js";
import List from "../List.vue";
import Modal from "../Modal.vue";
import TextField from "../TextField.vue";
import TransactionEdit from "../transactions/TransactionEdit.vue";
import TransactionListItem from "../transactions/TransactionListItem.vue";
import { dinero, isNegative as isDineroNegative } from "dinero.js";
import { intlFormat } from "../../filters/toCurrency";
import { ref, computed, toRefs, watch } from "vue";
import { USD } from "@dinero.js/currencies";
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

const isEditingAccount = ref(false);
const isEditingTransaction = ref(false);

const account = computed(() => accounts.items[accountId.value]);
const theseTransactions = computed<Array<Transaction>>(() => {
	const allTransactions = (transactions.transactionsForAccount[accountId.value] ??
		{}) as Dictionary<Transaction>;
	return Object.values(allTransactions).sort(reverseChronologically);
});
const numberOfTransactions = computed(() => theseTransactions.value.length);

const searchQuery = ref("");
const searchClient = computed(
	() => new Fuse(theseTransactions.value, { keys: ["title", "notes"] })
);
const filteredTransactions = computed<Array<Transaction>>(() =>
	searchQuery.value !== ""
		? searchClient.value.search(searchQuery.value).map(r => r.item)
		: theseTransactions.value
);

const remainingBalance = computed(() => accounts.currentBalance[accountId.value] ?? null);
const isNegative = computed(() =>
	isDineroNegative(remainingBalance.value ?? dinero({ amount: 0, currency: USD }))
);

watch(
	account,
	async account => {
		if (account) {
			await transactions.watchTransactions(account);
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

function startEditingAccount() {
	isEditingAccount.value = true;
}

function finishEditingAccount() {
	isEditingAccount.value = false;
}
</script>

<template>
	<div class="heading">
		<div class="account-title">
			<h1>{{ account?.title || "Account" }}</h1>
			<ActionButton class="edit" @click="startEditingAccount">
				<EditIcon />
			</ActionButton>
		</div>

		<p v-if="remainingBalance === null" class="account-balance">--</p>
		<p v-else class="account-balance" :class="{ negative: isNegative }">{{
			intlFormat(remainingBalance)
		}}</p>
	</div>

	<TextField v-model="searchQuery" type="search" placeholder="Search transactions" class="search" />

	<List class="transactions-list">
		<li v-if="searchQuery === ''">
			<AddTransactionListItem class="list-item header" @click="startCreatingTransaction" />
		</li>
		<li
			v-for="transaction in filteredTransactions"
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
	<Modal v-if="account" :open="isEditingAccount" :close-modal="finishEditingAccount">
		<AccountEdit :account="account" @deleted="goBack" @finished="finishEditingAccount" />
	</Modal>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.heading {
	display: flex;
	flex-flow: row nowrap;
	align-items: baseline;
	max-width: 36em;
	margin: 1em auto;

	> .account-title {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;

		> h1 {
			margin: 0;
		}

		.edit {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			color: color($link);
			min-height: 22pt;
			height: 22pt;
			min-width: 22pt;
			width: 22pt;
			margin-left: 8pt;

			.icon {
				height: 14pt;
			}
		}
	}

	.account-balance {
		margin: 0;
		margin-left: auto;
		text-align: right;
		font-weight: bold;
		padding-right: 0.7em;

		&.negative {
			color: color($red);
		}
	}
}

.search {
	max-width: 36em;
	margin: 1em auto;
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
