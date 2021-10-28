<script setup lang="ts">
import type { Tag as TagObject, TagRecordParams } from "../model/Tag";
import type { Transaction } from "../model/Transaction";
import EditButton from "./EditButton.vue";
import NavAction from "./NavAction.vue";
import NavTitle from "./NavTitle.vue";
import TagList from "./TagList.vue";
import TransactionEdit from "./TransactionEdit.vue";
import { computed, toRefs } from "vue";
import { toCurrency } from "../filters/toCurrency";
import { useAccountsStore, useTagsStore, useTransactionsStore } from "../store";
import { useRouter } from "vue-router";

const props = defineProps({
	accountId: { type: String, required: true },
	transactionId: { type: String, required: true },
});
const { accountId, transactionId } = toRefs(props);

const router = useRouter();
const accounts = useAccountsStore();
const transactions = useTransactionsStore();
const tags = useTagsStore();

const theseTransactions = computed(
	() => (transactions.transactionsForAccount[accountId.value] ?? {}) as Dictionary<Transaction>
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

async function createTag(params: TagRecordParams) {
	if (!transaction.value) return;
	const newTag = await tags.createTag(params);
	transaction.value.addTagId(newTag.id);
	await transactions.updateTransaction(transaction.value);
}

function modifyTag(tag: TagObject) {
	console.log("modify", tag);
}

async function removeTag(tag: TagObject) {
	if (!transaction.value) return;
	await transactions.removeTagFromTransaction(tag, transaction.value);
	await transactions.deleteTagIfUnreferenced(tag); // removing the tag won't automatically do this, for efficiency's sake, so we do it here
}
</script>

<template>
	<NavTitle v-if="transaction">
		<span class="title" aria-label="timestamp">{{ timestamp }}</span>
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
		<TagList
			:tag-ids="transaction.tagIds ?? []"
			@create-tag="createTag"
			@modify-tag="modifyTag"
			@remove-tag="removeTag"
		/>

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

.title {
	font-size: 24pt;
}

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
