<script setup lang="ts">
import NavAction from "./NavAction.vue";
import EditButton from "./EditButton.vue";
import { toTitleCase } from "../filters/toTitleCase";

import type { Transaction } from "../model/Transaction";
import { computed } from "vue";
import { useTransactionsStore } from "../store";

const props = defineProps({
	accountId: { type: String, required: true },
	transactionId: { type: String, required: true },
});

const transactions = useTransactionsStore();

const theseTransactions = computed<Dictionary<Transaction> | undefined>(
	() => transactions.transactionsForAccount[props.accountId]
);

const transaction = computed(() => theseTransactions.value[props.transactionId]);
</script>

<template>
	<NavAction>
		<EditButton>
			<template #modal>
				<h1>Edit {{ transaction.title ?? toTitleCase(transaction.type) }}</h1>
			</template>
		</EditButton>
	</NavAction>

	{{ transaction.title }}
	{{ transaction.amount }}
	{{ transaction.createdAt }}
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
