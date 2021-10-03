<script setup lang="ts">
import AccountListItem from "./AccountListItem.vue";
import NavAction from "./NavAction.vue";
import PlainButton from "./PlainButton.vue";

import { Account } from "../model/Account";
import { ref, computed } from "vue";
import { useAccountsStore } from "../store";

const accounts = useAccountsStore();

const allAccounts = computed(() => Object.values(accounts.items));
const isSaving = ref(false);

async function create() {
	isSaving.value = true;
	const newAccount = new Account();
	await accounts.saveAccount(newAccount);
	isSaving.value = false;
}
</script>

<template>
	<NavAction>
		<PlainButton :disabled="isSaving" @click="create">
			<span>+</span>
		</PlainButton>
	</NavAction>

	<ul>
		<li v-for="account in allAccounts" :key="account.id">
			<AccountListItem :account="account" />
		</li>
		<li>
			<p class="footer">We have {{ allAccounts.length }} accounts.</p>
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

.footer {
	color: color($secondary-label);
}
</style>
