<script setup lang="ts">
import AccountEdit from "./AccountEdit.vue";
import AccountListItem from "./AccountListItem.vue";
import ActionButton from "../buttons/ActionButton.vue";
import AddRecordListItem from "./AddRecordListItem.vue";
import ErrorNotice from "../ErrorNotice.vue";
import List from "../List.vue";
import Modal from "../Modal.vue";
import NewLoginModal from "../NewLoginModal.vue";
import ReloadIcon from "../../icons/Reload.vue";
import { computed, onMounted, ref } from "vue";
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
const isCreatingAccount = ref(false);

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

function startCreatingAccount() {
	isCreatingAccount.value = true;
}

function finishCreatingAccount() {
	isCreatingAccount.value = false;
}
</script>

<template>
	<main class="content">
		<div class="heading">
			<h1>Accounts</h1>
		</div>

		<ErrorNotice :error="loadError" />
		<ActionButton v-if="loadError" @click="load">
			<ReloadIcon />
		</ActionButton>

		<List v-if="!loadError">
			<li>
				<AddRecordListItem noun="account" @click="startCreatingAccount" />
			</li>
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

	<Modal :open="isCreatingAccount" :close-modal="finishCreatingAccount">
		<AccountEdit @finished="finishCreatingAccount" />
	</Modal>
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
