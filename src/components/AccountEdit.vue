<script setup lang="ts">
import type { PropType } from "vue";
import ActionButton from "./ActionButton.vue";
import TextAreaField from "./TextAreaField.vue";
import TextField from "./TextField.vue";
import { Account } from "../model/Account";
import { ref, computed, toRefs, onMounted } from "vue";
import { useAccountsStore, useTransactionsStore } from "../store";
import { useToast } from "vue-toastification";

const emit = defineEmits(["deleted", "finished"]);

const props = defineProps({
	account: { type: Object as PropType<Account | null>, default: null },
});
const { account: ogAccount } = toRefs(props);

const accounts = useAccountsStore();
const transactions = useTransactionsStore();
const toast = useToast();

const isCreatingAccount = computed(() => ogAccount.value === null);
const numberOfTransactions = computed<number>(() => {
	const theseTransactions = transactions.transactionsForAccount[ogAccount.value.id] ?? {};
	return Object.keys(theseTransactions).length;
});

const isLoading = ref(false);
const title = ref("");
const notes = ref("");
// const createdAt = computed(() => props.account.createdAt ?? new Date());

const titleField = ref<HTMLInputElement | null>(null);

onMounted(() => {
	// Opened, if we're modal
	title.value = ogAccount.value?.title ?? "";
	notes.value = ogAccount.value?.notes ?? "";
	titleField.value?.focus();
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

		if (isCreatingAccount.value) {
			await accounts.createAccount({
				...Account.defaultRecord(),
				title: title.value,
				notes: notes.value,
			});
		} else {
			await accounts.updateAccount(
				new Account(ogAccount.value.id, {
					title: title.value,
					notes: notes.value || ogAccount.value.notes,
					createdAt: ogAccount.value.createdAt,
				})
			);
		}

		emit("finished");
	} catch (error: unknown) {
		handleError(error);
	}

	isLoading.value = false;
}

async function deleteAccount() {
	isLoading.value = true;

	try {
		if (ogAccount.value === null) {
			throw new Error("No account to delete");
		}

		await accounts.deleteAccount(ogAccount.value);
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
		<h1 v-if="isCreatingAccount">Create Account</h1>
		<h1 v-else>Edit {{ ogAccount?.title ?? "Account" }}</h1>

		<TextField ref="titleField" v-model="title" label="title" placeholder="Bank Money" required />
		<TextAreaField v-model="notes" label="notes" placeholder="This is a thing" />

		<ActionButton type="submit" kind="bordered-primary" :disabled="isLoading">Save</ActionButton>
		<ActionButton
			v-if="!isCreatingAccount && numberOfTransactions === 0"
			kind="bordered-destructive"
			:disabled="isLoading"
			@click.prevent="deleteAccount"
			>Delete {{ ogAccount?.title ?? "Account" }}</ActionButton
		>
		<p v-if="isLoading">Saving...</p>
	</form>
</template>

<style scoped lang="scss">
form {
	> label {
		width: 80%;
	}
}
</style>
