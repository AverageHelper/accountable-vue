<script setup lang="ts">
import AccountEdit from "./AccountEdit.vue";
import ActionButton from "./ActionButton.vue";
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import EditButton from "./EditButton.vue";
import TransactionListItem from "./TransactionListItem.vue";

import { Transaction } from "../model/Transaction";
import { computed, ref, toRefs } from "vue";
import { useAccountsStore, useTransactionsStore } from "../store";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const props = defineProps({
	accountId: { type: String, required: true },
});
const { accountId } = toRefs(props);

const toast = useToast();
const router = useRouter();
const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const account = computed(() => accounts.items[accountId.value]);
const theseTransactions = computed<Dictionary<Transaction> | undefined>(
	() => transactions.transactionsForAccount[accountId.value]
);
const numberOfTransactions = computed(() => Object.keys(theseTransactions.value ?? {}).length);
const isSaving = ref(false);

async function create() {
	isSaving.value = true;
	try {
		await transactions.createTransaction(account.value, Transaction.defaultRecord({}));
	} catch (error: unknown) {
		let message: string;
		if (error instanceof Error) {
			message = error.message;
		} else {
			message = JSON.stringify(error);
		}
		toast.error(message);
	}
	isSaving.value = false;
}

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
		<ActionButton :disabled="isSaving" @click="create">
			<span>+</span>
		</ActionButton>
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
