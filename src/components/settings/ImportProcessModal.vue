<script setup lang="ts">
import type { PropType } from "vue";
import type { DatabaseSchema } from "../../model/DatabaseSchema";
import type JSZip from "jszip";
import ActionButton from "../ActionButton.vue";
import AccountListItem from "../accounts/AccountListItem.vue";
import Checkmark from "../../icons/Checkmark.vue";
import List from "../List.vue";
import Modal from "../Modal.vue";
import { computed, ref, reactive, toRefs, watch, nextTick } from "vue";
import { Account } from "../../model/Account";
import { useToast } from "vue-toastification";
import {
	useAccountsStore,
	useAttachmentsStore,
	useLocationsStore,
	useTagsStore,
	useUiStore,
} from "../../store";

const emit = defineEmits(["finished"]);

const props = defineProps({
	fileName: { type: String, default: "" },
	zip: { type: Object as PropType<JSZip | null>, default: null },
	db: { type: Object as PropType<DatabaseSchema | null>, default: null },
});
const { db, zip, fileName } = toRefs(props);

const accounts = useAccountsStore();
const attachments = useAttachmentsStore();
const locations = useLocationsStore();
const tags = useTagsStore();
const ui = useUiStore();
const toast = useToast();

const accountIdsToImport = reactive(new Set<string>());
const numberOfAttachmentsToImport = computed(() => db.value?.attachments?.length ?? 0);
const numberOfLocationsToImport = computed(() => db.value?.locations?.length ?? 0);
const numberOfTagsToImport = computed(() => db.value?.tags?.length ?? 0);

const isImporting = ref(false);
const itemsImported = ref(0);
const totalItemsToImport = computed(() => {
	let numberOfTransactionsToImport = 0;
	accountIdsToImport.forEach(a => {
		numberOfTransactionsToImport += transactionCounts.value[a] ?? 0;
	});

	return (
		numberOfTransactionsToImport +
		numberOfTagsToImport.value +
		numberOfLocationsToImport.value +
		numberOfAttachmentsToImport.value +
		accountIdsToImport.size
	);
});
const importProgressPercent = computed(() => {
	const yet = itemsImported.value;
	const total = totalItemsToImport.value;
	const progress = total === 0 ? 1 : yet / total;
	return Intl.NumberFormat(undefined, { style: "percent" }).format(progress);
});

const hasDb = computed(() => db.value !== null);
const storedAccounts = computed(() => accounts.allAccounts);
const importedAccounts = computed(() =>
	(db.value?.accounts ?? []).map(acct => new Account(acct.id, acct))
);
const duplicateAccounts = computed(() =>
	importedAccounts.value.filter(a1 => storedAccounts.value.some(a2 => a2.id === a1.id))
);
const newAccounts = computed(() =>
	importedAccounts.value.filter(a1 => !storedAccounts.value.some(a2 => a2.id === a1.id))
);
const transactionCounts = computed<Dictionary<number>>(() => {
	const result: Dictionary<number> = {};
	if (!db.value) return result;

	const accounts = db.value?.accounts ?? [];
	for (const a of accounts) {
		result[a.id] = (a.transactions ?? []).length;
	}

	return result;
});

watch(importedAccounts, importedAccounts => {
	if (hasDb.value && importedAccounts.length === 0) {
		toast.info(`${fileName.value || "That file"} contains no financial data.`);
		forgetDb();
	}
});

function toggleAccount(account: Account) {
	if (isImporting.value) return; // Don't modify import while we're importing

	if (accountIdsToImport.has(account.id)) {
		accountIdsToImport.delete(account.id);
	} else {
		accountIdsToImport.add(account.id);
	}
}

function forgetDb() {
	if (!isImporting.value) {
		emit("finished");
	}
}

// TODO: Analyze the consequenses of this import. Will this overwrite some entries, and add other ones?
async function beginImport() {
	if (!db.value) return;
	isImporting.value = true;
	itemsImported.value = 0;

	try {
		for (const accountId of accountIdsToImport) {
			const accountToImport = db.value.accounts?.find(a => a.id === accountId);
			if (!accountToImport) continue;
			await accounts.importAccount(accountToImport);

			itemsImported.value += transactionCounts.value[accountToImport.id] ?? 0;
			itemsImported.value += 1;
			await nextTick();
		}

		await locations.importLocations(db.value.locations ?? []);
		itemsImported.value += numberOfLocationsToImport.value;
		await nextTick();

		await tags.importTags(db.value.tags ?? []);
		itemsImported.value += numberOfTagsToImport.value;
		await nextTick();

		await attachments.importAttachments(db.value.attachments ?? [], zip.value);
		itemsImported.value += numberOfAttachmentsToImport.value;
		await nextTick();

		toast.success("Imported all the things!");
		emit("finished");
	} catch (error: unknown) {
		ui.handleError(error);
	}

	isImporting.value = false;
}
</script>

<template>
	<Modal :open="hasDb" :close-modal="forgetDb">
		<h1>Select Accounts from &quot;{{ fileName }}&quot;</h1>

		<div v-if="newAccounts.length > 0">
			<h4>New Accounts</h4>
			<List>
				<li v-for="account in newAccounts" :key="account.id" class="importable">
					<AccountListItem
						class="account"
						:account="account"
						:link="false"
						:count="transactionCounts[account.id] ?? 0"
						@click.prevent="() => toggleAccount(account)"
					/>
					<Checkmark v-if="accountIdsToImport.has(account.id)" />
				</li>
			</List>
		</div>

		<div v-if="duplicateAccounts.length > 0">
			<h4>Duplicate Accounts</h4>
			<p
				>These entries seem to match an account you already have. Would you like to overwrite the
				account and transactions we have stored with what you gave us here?</p
			>
			<List>
				<li v-for="account in duplicateAccounts" :key="account.id" class="importable">
					<AccountListItem
						class="account"
						:account="account"
						:link="false"
						:count="transactionCounts[account.id] ?? 0"
						@click.prevent="() => toggleAccount(account)"
					/>
					<Checkmark v-if="accountIdsToImport.has(account.id)" />
				</li>
			</List>
		</div>

		<div>
			<h4>Everything Else</h4>
			<List>
				<li class="importable">{{ numberOfLocationsToImport }} locations <Checkmark /></li>
				<li class="importable">{{ numberOfTagsToImport }} tags <Checkmark /></li>
				<li class="importable">{{ numberOfAttachmentsToImport }} attachments <Checkmark /></li>
			</List>
		</div>

		<div class="buttons">
			<ActionButton
				class="continue"
				kind="bordered-primary"
				:disabled="isImporting || accountIdsToImport.size === 0"
				@click.prevent="beginImport"
			>
				<span v-if="isImporting">Importing... ({{ importProgressPercent }})</span>
				<span v-else>Begin Import</span>
			</ActionButton>
		</div>
	</Modal>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.importable {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;

	.account {
		width: 100%;
	}

	.icon {
		margin-left: 8pt;
	}
}

.buttons {
	display: flex;
	flex-flow: row wrap;

	:not(:last-child) {
		margin-right: 8pt;
	}

	.continue {
		margin-left: auto;
	}
}
</style>
