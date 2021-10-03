<script setup lang="ts">
import { computed } from "vue";
import { Transaction } from "../model/Transaction";

const props = defineProps({
	transaction: { type: Transaction, required: true },
});

const transactionRoute = computed(
	() => `/accounts/${props.transaction.accountId}/transactions/${props.transaction.id}`
);
</script>

<template>
	<router-link class="transaction-list-item" :to="transactionRoute">
		<span class="title">{{ transaction.title }}</span>
		<span class="amount">{{ transaction.amount }}</span>
	</router-link>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.transaction-list-item {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	justify-content: space-between;
	padding: 0.75em;
	margin-bottom: 0.5em;
	text-decoration: none;
	color: color($label);
	background-color: color($cloud);

	.title {
		font-weight: bold;
	}

	.amount {
		//
	}
}
</style>
