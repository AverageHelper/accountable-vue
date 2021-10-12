<script setup lang="ts">
import EditButton from "./EditButton.vue";
import NavAction from "./NavAction.vue";
import TransactionEdit from "./TransactionEdit.vue";
import { computed, toRefs } from "vue";
import { useAccountsStore, useTransactionsStore } from "../store";
import { useRouter } from "vue-router";

const props = defineProps({
	accountId: { type: String, required: true },
	transactionId: { type: String, required: true },
});
const { accountId, transactionId } = toRefs(props);

const router = useRouter();
const accounts = useAccountsStore();
const transactions = useTransactionsStore();

const theseTransactions = computed(
	() => transactions.transactionsForAccount[accountId.value] ?? {}
);
const account = computed(() => accounts.items[accountId.value]);
const transaction = computed(() => theseTransactions.value[transactionId.value]);

function goBack() {
	router.back();
}
</script>

<template>
	<NavAction>
		<EditButton v-if="account && transaction">
			<template #modal="{ onFinished }">
				<TransactionEdit
					:account="account"
					:transaction="transaction"
					@deleted="goBack"
					@finished="onFinished"
				/>
			</template>
		</EditButton>
	</NavAction>

	<div v-if="transaction">
		{{ transaction.title }}
		{{ transaction.amount }}
		{{ transaction.createdAt }}
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
