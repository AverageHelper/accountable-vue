<script setup lang="ts">
import NavAction from "./NavAction.vue";
import AccountListItem from "./AccountListItem.vue";

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
	<NavAction>
		<div v-if="isSaving">...</div>
		<button v-else :disabled="isSaving" @click="create">+</button>
	</NavAction>

	<ul>
		<li v-for="account in accounts" :key="account.id">
			<AccountListItem :account="account" />
		</li>
		<li>
			<p>We have {{ accounts.length }} accounts.</p>
		</li>
	</ul>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

a {
	color: color($green);
}

ul {
	list-style: none;
	padding: 0;
	max-width: 36em;
	margin: 0 auto;
}
</style>
