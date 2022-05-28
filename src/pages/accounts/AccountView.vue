<script setup lang="ts">
import type { Transaction } from "../../model/Transaction";
import AccountEdit from "./AccountEdit.vue";
import ActionButton from "../../components/buttons/ActionButton.vue";
import AddRecordListItem from "./AddRecordListItem.vue";
import EditIcon from "../../icons/Edit.vue";
import Fuse from "fuse.js";
import List from "../../components/List.vue";
import Modal from "../../components/Modal.vue";
import SearchBar from "../../components/SearchBar.vue";
import TransactionCreateModal from "../transactions/TransactionCreateModal.vue";
import TransactionMonthListItem from "../transactions/TransactionMonthListItem.vue";
import TransactionListItem from "../transactions/TransactionListItem.vue";
import { dinero, isNegative as isDineroNegative } from "dinero.js";
import { intlFormat } from "../../transformers";
import { ref, computed, toRefs, watch } from "vue";
import { reverseChronologically } from "../../model/utility/sort";
import { USD } from "@dinero.js/currencies";
import { useAccountsStore, useTransactionsStore } from "../../store";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
	accountId: { type: String, required: true },
});
const { accountId } = toRefs(props);

const route = useRoute();
const router = useRouter();
const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const isEditingAccount = ref(false);
const isEditingTransaction = ref(false);

const account = computed(() => accounts.items[accountId.value] ?? null);
const theseTransactions = computed<Array<Transaction>>(() => {
	const allTransactions = (transactions.transactionsForAccount[accountId.value] ??
		{}) as Dictionary<Transaction>;
	return Object.values(allTransactions).sort(reverseChronologically);
});
const transactionMonths = computed(
	() => transactions.transactionsForAccountByMonth[accountId.value] ?? {}
);

const searchClient = computed(
	() => new Fuse(theseTransactions.value, { keys: ["title", "notes"] })
);
const searchQuery = computed(() => (route.query["q"] ?? "").toString());
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
	account => {
		if (account) {
			void transactions.watchTransactions(account);
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
	<main class="content">
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

		<SearchBar class="search" />

		<!-- Search Results -->
		<List v-if="searchQuery" class="transaction-months-list">
			<li v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction">
				<TransactionListItem :transaction="transaction" />
			</li>
			<li>
				<p class="footer">
					<span>{{ filteredTransactions.length }}</span> of
					<span>{{ theseTransactions.length }}</span> transaction<span
						v-if="theseTransactions.length !== 1"
						>s</span
					>
				</p>
			</li>
		</List>

		<!-- Months (normal view) -->
		<List v-else class="transaction-months-list">
			<li>
				<AddRecordListItem @click="startCreatingTransaction" />
			</li>
			<li v-for="[month, monthTransactions] in Object.entries(transactionMonths)" :key="month">
				<TransactionMonthListItem
					:account-id="accountId"
					:month-name="month"
					:count="monthTransactions.length"
				/>
			</li>
		</List>
	</main>

	<TransactionCreateModal
		v-if="account"
		:account="account"
		:is-open="isEditingTransaction"
		:close-modal="finishCreatingTransaction"
	/>
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

.transaction-months-list {
	.footer {
		padding-top: 0.5em;
		user-select: none;
		color: color($secondary-label);
	}
}
</style>
