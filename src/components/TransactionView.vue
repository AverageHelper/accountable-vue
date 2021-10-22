<script setup lang="ts">
import EditButton from "./EditButton.vue";
import NavAction from "./NavAction.vue";
import NavTitle from "./NavTitle.vue";
import TransactionEdit from "./TransactionEdit.vue";
import { computed, toRefs } from "vue";
import { toCurrency } from "../filters/toCurrency";
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

const timestamp = computed(() => {
	if (!transaction.value) return "";

	const formatter = Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" });
	return formatter.format(transaction.value.createdAt);
});

function goBack() {
	router.back();
}
</script>

<template>
	<NavTitle v-if="transaction">
		<span aria-label="timestamp">{{ timestamp }}</span>
	</NavTitle>

	<NavAction v-if="account && transaction">
		<EditButton>
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

	<div v-if="transaction" class="content">
		<div class="header">
			<h1 aria-label="title">{{ transaction.title }}</h1>

			<div class="amount-container">
				<p class="amount" :class="{ negative: transaction.amount < 0 }" aria-label="amount">{{
					toCurrency(transaction.amount)
				}}</p>
				<!-- <p class="amount" :class="{ negative: transaction.amount < 0 }" aria-label="amount">{{
					toCurrency(transaction.amount)
				}}</p> -->
			</div>
		</div>

		<p v-if="transaction.notes" class="notes">{{ transaction.notes }}</p>
		<p v-else class="notes empty">No notes</p>

		<p v-if="transaction.locationId">{{ transaction.locationId }}</p>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.content {
	text-align: center;
	max-width: 400pt;
	margin: 0 auto;

	.header {
		display: flex;
		flex-flow: row nowrap;
		align-items: flex-end;
		justify-content: space-between;

		h1 {
			margin-bottom: 0;
		}
	}

	.amount-container {
		display: flex;
		flex-direction: column;
		height: min-content;

		p {
			margin: 0;
		}
	}

	p.amount {
		font-weight: bold;

		&.negative {
			color: color($red);
		}
	}

	p.notes {
		text-align: left;
		font-weight: bold;
		margin-top: 0.5em;

		&.empty {
			color: color($secondary-label);
			font-style: italic;
			font-weight: normal;
		}
	}
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
