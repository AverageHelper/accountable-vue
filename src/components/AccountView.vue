<script setup lang="ts">
import type { Transaction } from "../model/Transaction";
import AccountEdit from "./AccountEdit.vue";
import EditButton from "./EditButton.vue";
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import TransactionEdit from "./TransactionEdit.vue";
import TransactionListItem from "./TransactionListItem.vue";
import { computed, toRefs, watch } from "vue";
import { useAccountsStore, useTransactionsStore } from "../store";
import { useRouter } from "vue-router";

const props = defineProps({
	accountId: { type: String, required: true },
});
const { accountId } = toRefs(props);

const router = useRouter();
const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const account = computed(() => accounts.items[accountId.value]);
const theseTransactions = computed<Dictionary<Transaction> | undefined>(
	() => transactions.transactionsForAccount[accountId.value]
);
const numberOfTransactions = computed(() => Object.keys(theseTransactions.value ?? {}).length);

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

	<List>
		<li v-for="transaction in theseTransactions" :key="transaction.id">
			<TransactionListItem :transaction="transaction" />
		</li>
		<li>
			<p class="footer">
				{{ numberOfTransactions }} transaction<span v-if="numberOfTransactions !== 1">s</span>
			</p>
		</li>
	</List>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
