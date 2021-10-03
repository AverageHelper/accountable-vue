<script setup lang="ts">
import AccountListItem from "./AccountListItem.vue";
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import PlainButton from "./PlainButton.vue";

import { Account } from "../model/Account";
import { ref, computed } from "vue";
import { useAccountsStore } from "../store";

const accounts = useAccountsStore();

const allAccounts = computed(() => Object.values(accounts.items));
const numberOfAccounts = computed(() => Object.keys(allAccounts.value).length);
const isSaving = ref(false);

async function create() {
	isSaving.value = true;
	const newAccount = new Account();
	try {
		await accounts.saveAccount(newAccount);
	} catch {
		// nop for now
	}
	isSaving.value = false;
}
</script>

<template>
	<NavAction>
		<PlainButton :disabled="isSaving" @click="create">
			<span>+</span>
		</PlainButton>
	</NavAction>

	<List>
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
