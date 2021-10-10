<script setup lang="ts">
import AccountEdit from "./AccountEdit.vue";
import AccountListItem from "./AccountListItem.vue";
import ActionButton from "./ActionButton.vue";
import EditButton from "./EditButton.vue";
import ErrorNotice from "./ErrorNotice.vue";
import List from "./List.vue";
import NavAction from "./NavAction.vue";
import ReloadIcon from "../icons/Reload.vue";
import { ref, computed, onMounted } from "vue";
import { useAccountsStore } from "../store";

const accounts = useAccountsStore();

const allAccounts = computed(() => Object.values(accounts.items));
const numberOfAccounts = computed(() => Object.keys(allAccounts.value).length);
const loadError = computed<Error | null>(() => accounts.loadError);

async function load() {
	accounts.watchAccounts();
}

onMounted(() => {
	load();
});
</script>

<template>
	<NavAction>
		<ActionButton v-if="loadError" @click="load">
			<ReloadIcon />
		</ActionButton>
		<EditButton v-else>
			<template #icon>
				<span>+</span>
			</template>
			<template #modal="{ onFinished }">
				<AccountEdit @finished="onFinished" />
			</template>
		</EditButton>
	</NavAction>

	<ErrorNotice :error="loadError" />
	<List v-if="!loadError">
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
