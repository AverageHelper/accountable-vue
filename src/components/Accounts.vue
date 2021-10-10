<script setup lang="ts">
import AccountListItem from "./AccountListItem.vue";
import ActionButton from "./ActionButton.vue";
import ErrorNotice from "./ErrorNotice.vue";
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import ReloadIcon from "../icons/Reload.vue";

import { Account } from "../model/Account";
import { ref, computed, onMounted } from "vue";
import { useAccountsStore } from "../store";
import { useToast } from "vue-toastification";

const accounts = useAccountsStore();
const toast = useToast();

const allAccounts = computed(() => Object.values(accounts.items));
const numberOfAccounts = computed(() => Object.keys(allAccounts.value).length);
const isSaving = ref(false);
const isLoading = ref(false);
const loadError = ref<Error | null>(null);

async function load() {
	isLoading.value = true;
	loadError.value = null;

	try {
		await accounts.getAccounts();
	} catch (error: unknown) {
		if (error instanceof Error) {
			loadError.value = error;
		} else {
			const message = JSON.stringify(error);
			loadError.value = new Error(message);
		}
		console.error(error);
	}

	isLoading.value = false;
}

async function create() {
	isSaving.value = true;
	try {
		await accounts.createAccount(Account.defaultRecord());
		await load();
	} catch (error: unknown) {
		let message: string;
		if (error instanceof Error) {
			message = error.message;
		} else {
			message = JSON.stringify(error);
		}
		toast.error(message);
		console.error(error);
	}
	isSaving.value = false;
}

onMounted(async () => {
	await load();
});
</script>

<template>
	<NavAction>
		<ActionButton v-if="loadError" @click="load">
			<ReloadIcon />
		</ActionButton>
		<ActionButton v-else-if="!isLoading" :disabled="isSaving" @click="create">
			<span>+</span>
		</ActionButton>
	</NavAction>

	<ErrorNotice :error="loadError" />
	<List v-if="!loadError && !isLoading">
		<li v-for="account in allAccounts" :key="account.id">
			<AccountListItem :account="account" />
		</li>
		<li>
			<p class="footer">
				{{ numberOfAccounts }} account<span v-if="numberOfAccounts !== 1">s</span>
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
