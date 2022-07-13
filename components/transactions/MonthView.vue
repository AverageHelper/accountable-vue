<script setup lang="ts">
import type { Transaction } from "../../model/Transaction";
import AddRecordListItem from "../accounts/AddRecordListItem.vue";
import List from "../../components/List.vue";
import TransactionCreateModal from "./TransactionCreateModal.vue";
import TransactionListItem from "./TransactionListItem.vue";
import { computed, ref, toRefs } from "vue";
import { useAccountsStore, useTransactionsStore } from "../../store";

const props = defineProps({
	accountId: { type: String, required: true },
	rawMonth: { type: String, required: true },
});
const { accountId, rawMonth } = toRefs(props);

const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const isEditingTransaction = ref(false);

const month = computed<string | null>(() => {
	// Perhaps validate with regex? Would have to match the locale tho
	return decodeURIComponent(rawMonth.value);
});

const monthTransactions = computed<Array<Transaction>>(() => {
	if (month.value === null || !month.value) return [];
	const byMonth = transactions.transactionsForAccountByMonth[accountId.value] ?? {};
	return byMonth[month.value] ?? [];
});

const account = computed(() => accounts.items[accountId.value] ?? null);

function startCreatingTransaction() {
	isEditingTransaction.value = true;
}

function finishCreatingTransaction() {
	isEditingTransaction.value = false;
}
</script>

<template>
	<main class="content">
		<div class="heading">
			<div class="month-title">
				<h1>{{ month }}</h1>
			</div>
		</div>

		<List v-if="month">
			<li>
				<AddRecordListItem @click="startCreatingTransaction" />
			</li>
			<li v-for="transaction in monthTransactions" :key="transaction.id" class="transaction">
				<TransactionListItem :transaction="transaction" />
			</li>
			<li>
				<p class="footer">
					<!-- TODO: I18N -->
					<span>{{ monthTransactions?.length ?? 0 }}</span> transaction<span
						v-if="monthTransactions?.length !== 1"
						>s</span
					>
				</p>
			</li>
		</List>
		<p v-else>{{ month }} does not match a month identifier pattern</p>
	</main>

	<TransactionCreateModal
		v-if="account"
		:account="account"
		:is-open="isEditingTransaction"
		:close-modal="finishCreatingTransaction"
	/>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.heading {
	display: flex;
	flex-flow: row nowrap;
	align-items: baseline;
	max-width: 36em;
	margin: 1em auto;

	> .month-title {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;

		> h1 {
			margin: 0;
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
</style>
