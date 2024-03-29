<script setup lang="ts">
import type { Account } from "../../model/Account";
import type { PropType } from "vue";
import ActionButton from "../../components/buttons/ActionButton.vue";
import TextAreaField from "../../components/inputs/TextAreaField.vue";
import TextField from "../../components/inputs/TextField.vue";
import { account as newAccount } from "../../model/Account";
import { ref, computed, toRefs, onMounted } from "vue";
import { useAccountsStore, useTransactionsStore, useUiStore } from "../../store";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["deleted", "finished"]);

const props = defineProps({
	account: { type: Object as PropType<Account | null>, default: null },
});
const { account: ogAccount } = toRefs(props);

const accounts = useAccountsStore();
const transactions = useTransactionsStore();
const ui = useUiStore();
const i18n = useI18n();

const isCreatingAccount = computed(() => ogAccount.value === null);
const numberOfTransactions = computed<number>(() => {
	if (!ogAccount.value) return 0;
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

async function submit() {
	isLoading.value = true;

	try {
		if (!title.value) {
			throw new Error(i18n.t("error.form.missing-required-fields"));
		}

		if (ogAccount.value === null) {
			await accounts.createAccount({
				createdAt: new Date(),
				title: title.value,
				notes: notes.value,
			});
		} else {
			await accounts.updateAccount(
				newAccount({
					id: ogAccount.value.id,
					title: title.value,
					notes: notes.value || ogAccount.value.notes,
					createdAt: ogAccount.value.createdAt,
				})
			);
		}

		emit("finished");
	} catch (error) {
		ui.handleError(error);
	}

	isLoading.value = false;
}

async function deleteAccount() {
	isLoading.value = true;

	try {
		if (ogAccount.value === null) {
			throw new Error("No account to delete"); // TODO: I18N
		}

		await accounts.deleteAccount(ogAccount.value);
		emit("deleted");
		emit("finished");
	} catch (error) {
		ui.handleError(error);
	}

	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submit">
		<!-- TODO: I18N -->
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
	align-items: center;

	> label {
		width: 80%;
	}
}
</style>
