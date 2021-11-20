<script setup lang="ts">
import type { PropType } from "vue";
import type { DatabaseSchema } from "../../model/DatabaseSchema";
import type JSZip from "jszip";
import ActionButton from "../ActionButton.vue";
import AccountListItem from "../accounts/AccountListItem.vue";
import Checkmark from "../../icons/Checkmark.vue";
import List from "../List.vue";
import Modal from "../Modal.vue";
import { computed, ref, reactive, toRefs, watch } from "vue";
import { Account } from "../../model/Account";
import { useToast } from "vue-toastification";
import { useAccountsStore, useUiStore } from "../../store";

const emit = defineEmits(["finished"]);

const props = defineProps({
	fileName: { type: String, default: "" },
	zip: { type: Object as PropType<JSZip | null>, default: null },
	db: { type: Object as PropType<DatabaseSchema | null>, default: null },
});
const { db, zip, fileName } = toRefs(props);

const accounts = useAccountsStore();
const ui = useUiStore();
const toast = useToast();

const accountsToImport = reactive(new Set<string>());
const isImporting = ref(false);

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

watch(importedAccounts, importedAccounts => {
	if (hasDb.value && importedAccounts.length === 0) {
		toast.info(`${fileName.value || "That file"} contains no financial data.`);
		forgetDb();
	}
});

function toggleAccount(account: Account) {
	if (accountsToImport.has(account.id)) {
		accountsToImport.delete(account.id);
	} else {
		accountsToImport.add(account.id);
	}
}

function forgetDb() {
	if (!isImporting.value) {
		emit("finished");
	}
}

// TODO: Analyze the consequenses of this import. Will this overwrite some entries, and add other ones?
async function beginImport() {
	isImporting.value = true;
	if (!db.value) return;

	try {
		for (const accountId of accountsToImport) {
			const accountToImport = db.value.accounts?.find(a => a.id === accountId);
			if (!accountToImport) continue;
			await accounts.importAccount(accountToImport, zip.value);
		}

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
						@click.prevent="() => toggleAccount(account)"
					/>
					<Checkmark v-if="accountsToImport.has(account.id)" />
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
						@click.prevent="() => toggleAccount(account)"
					/>
					<Checkmark v-if="accountsToImport.has(account.id)" />
				</li>
			</List>
		</div>

		<p v-if="accountsToImport.size > 0" class="prompt"
			>{{ accountsToImport.size }} account selected</p
		>
		<div class="buttons">
			<ActionButton
				class="continue"
				kind="bordered-primary"
				:disabled="isImporting || accountsToImport.size === 0"
				@click.prevent="beginImport"
			>
				<span v-if="isImporting">Importing...</span>
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

.prompt {
	color: color($secondary-label);
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
