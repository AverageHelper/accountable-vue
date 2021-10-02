<script setup lang="ts">
import { Account } from "../model/Account";
import { ref, computed } from "vue";
import { useAccountsStore } from "../store";

const accountsStore = useAccountsStore();

const accounts = computed(() => Object.values(accountsStore.accounts));
const isSaving = ref(false);

async function create() {
	isSaving.value = true;
	const newAccount = new Account();
	await accountsStore.saveAccount(newAccount);
	isSaving.value = false;
}
</script>

<template>
	<h1>Accounts</h1>

	<p>We have {{ accounts.length }} accounts</p>
	<button :disabled="isSaving" @click="create">Create account</button>
	<span v-if="isSaving">Loading...</span>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

a {
	color: color($green);
}

label {
	margin: 0 0.5em;
	font-weight: bold;
}
</style>
