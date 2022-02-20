<script setup lang="ts">
import AccountEdit from "./AccountEdit.vue";
import AccountListItem from "./AccountListItem.vue";
import ActionButton from "../ActionButton.vue";
import EditButton from "../EditButton.vue";
import ErrorNotice from "../ErrorNotice.vue";
import List from "../List.vue";
import NavAction from "../NavAction.vue";
import NewLoginModal from "../NewLoginModal.vue";
import ReloadIcon from "../../icons/Reload.vue";
import { computed, onMounted } from "vue";
import {
	useAccountsStore,
	useAttachmentsStore,
	useLocationsStore,
	useTagsStore,
} from "../../store";

const accounts = useAccountsStore();
const attachments = useAttachmentsStore();
const locations = useLocationsStore();
const tags = useTagsStore();

const allAccounts = computed(() => accounts.allAccounts);
const numberOfAccounts = computed(() => accounts.numberOfAccounts);
const loadError = computed<Error | null>(() => accounts.loadError);

async function load() {
	console.log("Starting watchers...");
	await Promise.all([
		accounts.watchAccounts(),
		attachments.watchAttachments(),
		locations.watchLocations(),
		tags.watchTags(),
	]);
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
		<EditButton v-else>
			<template #icon>
				<span>+</span>
			</template>
			<template #modal="{ onFinished }">
				<AccountEdit @finished="onFinished" />
			</template>
		</EditButton>
	</NavAction>

	<main class="content">
		<div class="heading">
			<h1>Accounts</h1>
			<p>To add an account, click the (+) button in the upper corner.</p>
		</div>

		<ErrorNotice :error="loadError" />
		<List v-if="!loadError">
			<li v-for="account in allAccounts" :key="account.id">
				<AccountListItem :account="account" />
			</li>
			<li v-if="numberOfAccounts > 0">
				<p class="footer"
					>{{ numberOfAccounts }} account<span v-if="numberOfAccounts !== 1">s</span>
				</p>
			</li>
		</List>
	</main>

	<NewLoginModal />
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.heading {
	max-width: 36em;
	margin: 1em auto;

	> h1 {
		margin: 0;
	}
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
