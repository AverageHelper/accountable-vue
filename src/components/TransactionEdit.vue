<script setup lang="ts">
import type { Account } from "../model/Account";
import type { PropType } from "vue";
import type { TransactionRecordParams } from "../model/Transaction";
import ActionButton from "./ActionButton.vue";
import Checkbox from "./Checkbox.vue";
import CurrencyInput from "./CurrencyInput.vue";
import DateTimeInput from "./DateTimeInput.vue";
import TextAreaField from "./TextAreaField.vue";
import TextField from "./TextField.vue";
import { Transaction } from "../model/Transaction";
import { ref, computed, toRefs, onMounted } from "vue";
import { toTitleCase } from "../filters/toTitleCase";
import { useTransactionsStore } from "../store";
import { useToast } from "vue-toastification";

const emit = defineEmits(["deleted", "finished"]);

const props = defineProps({
	account: { type: Object as PropType<Account>, required: true },
	transaction: { type: Object as PropType<Transaction | null>, default: null },
});
const { account, transaction: ogTransaction } = toRefs(props);

const transactions = useTransactionsStore();
const toast = useToast();

const isCreatingTransaction = computed(() => ogTransaction.value === null);

const isLoading = ref(false);
const title = ref("");
const notes = ref("");
const location = ref("");
const createdAt = ref(new Date());
const amount = ref(0);
const isReconciled = ref(false);

createdAt.value.setSeconds(0, 0);

onMounted(() => {
	// Opened, if we're modal
	title.value = ogTransaction.value?.title ?? title.value;
	notes.value = ogTransaction.value?.notes ?? notes.value;
	// location.value = ogTransaction.value?.location ?? location.value;
	createdAt.value = ogTransaction.value?.createdAt ?? createdAt.value;
	amount.value = ogTransaction.value?.amount ?? amount.value;
	isReconciled.value = ogTransaction.value?.isReconciled ?? isReconciled.value;
});

function handleError(error: unknown) {
	let message: string;
	if (error instanceof Error) {
		message = error.message;
	} else {
		message = JSON.stringify(error);
	}
	toast.error(message);
	console.error(error);
}

async function submit() {
	isLoading.value = true;

	try {
		if (!title.value) {
			throw new Error("Title is required");
		}

		const params: TransactionRecordParams = {
			title: title.value,
			notes: notes.value,
			createdAt: createdAt.value,
			isReconciled: isReconciled.value,
			amount: amount.value,
		};
		if (isCreatingTransaction.value) {
			await transactions.createTransaction(account.value, params);
		} else {
			await transactions.updateTransaction(
				new Transaction(account.value.id, ogTransaction.value.id, params)
			);
		}

		emit("finished");
	} catch (error: unknown) {
		handleError(error);
	}

	isLoading.value = false;
}

async function deleteTransaction() {
	isLoading.value = true;

	try {
		if (ogTransaction.value === null) {
			throw new Error("No account to delete");
		}

		await transactions.deleteTransaction(ogTransaction.value);
		emit("deleted");
		emit("finished");
	} catch (error: unknown) {
		handleError(error);
	}

	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submit">
		<h1 v-if="isCreatingTransaction">Create Transaction</h1>
		<h1 v-else>Edit {{ toTitleCase(ogTransaction?.type) ?? "Transaction" }}</h1>
		<span>Account: {{ account.title ?? "Unknown" }}</span>

		<CurrencyInput v-model="amount" label="amount" />
		<Checkbox v-model="isReconciled" label="Reconciled" class="checkbox" />
		<TextField v-model="title" label="title" placeholder="Bank Money" />
		<TextAreaField v-model="notes" label="notes" placeholder="This is a thing" />
		<TextField v-model="location" label="location" placeholder="Swahilli, New Guinnea" />
		<DateTimeInput v-model="createdAt" label="date" />

		<ActionButton type="submit" kind="bordered" :disabled="isLoading">Save</ActionButton>
		<ActionButton
			v-if="!isCreatingTransaction"
			kind="bordered-destructive"
			:disabled="isLoading"
			@click.prevent="deleteTransaction"
			>Delete {{ ogTransaction?.title ?? "Account" }}</ActionButton
		>
		<p v-if="isLoading">Saving...</p>
	</form>
</template>

<style scoped lang="scss">
form {
	> label:not(.checkbox) {
		width: 80%;
	}
}
</style>
