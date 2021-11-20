<script setup lang="ts">
import type { AccountRecordParams } from "../../model/Account";
import type { AttachmentRecordParams } from "../../model/Attachment";
import type { LocationRecordParams } from "../../model/Location";
import type { TagRecordParams } from "../../model/Tag";
import type { TransactionRecordParams } from "../../model/Transaction";
import type { PropType } from "vue";
import type { Schema } from "../../model/DatabaseSchema";
import type JSZip from "jszip";
import ActionButton from "../ActionButton.vue";
import AccountListItem from "../accounts/AccountListItem.vue";
import Checkmark from "../../icons/Checkmark.vue";
import List from "../List.vue";
import Modal from "../Modal.vue";
import { computed, ref, reactive, toRefs, watch } from "vue";
import { Account } from "../../model/Account";
import { useToast } from "vue-toastification";
import {
	useAccountsStore,
	useAttachmentsStore,
	useLocationsStore,
	useTagsStore,
	useTransactionsStore,
	useUiStore,
} from "../../store";

const emit = defineEmits(["finished"]);

const props = defineProps({
	fileName: { type: String, default: "" },
	zip: { type: Object as PropType<JSZip | null>, default: null },
	db: { type: Object as PropType<Schema | null>, default: null },
});
const { db, zip, fileName } = toRefs(props);

const accounts = useAccountsStore();
const attachments = useAttachmentsStore();
const locations = useLocationsStore();
const tags = useTagsStore();
const transactions = useTransactionsStore();
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

// TODO: Move this into a store
// TODO: Analyze the consequenses of this import. Will this overwrite some entries, and add other ones?
async function beginImport() {
	isImporting.value = true;
	if (!db.value) return;

	try {
		for (const accountId of accountsToImport) {
			const accountToImport = db.value.accounts?.find(a => a.id === accountId);
			if (!accountToImport) continue;

			// Account data
			const storedAccount = accounts.items[accountId] ?? null;
			let newAccount: Account;
			if (storedAccount) {
				// If duplicate, overwrite the one we have
				newAccount = storedAccount.updatedWith(accountToImport);
				await accounts.updateAccount(newAccount);
			} else {
				// If new, create a new account
				const params: AccountRecordParams = {
					...accountToImport,
					title: accountToImport.title.trim(),
					notes: accountToImport.notes?.trim() ?? null,
				};
				newAccount = await accounts.createAccount(params);
			}

			// Transaction data
			const storedTransactions = transactions.transactionsForAccount[accountId] ?? {};
			for (const transactionToImport of accountToImport.transactions ?? []) {
				const storedTransaction = storedTransactions[transactionToImport.id] ?? null;
				if (storedTransaction) {
					// If duplicate, overwrite the one we have
					const newTransaction = storedTransaction.updatedWith(transactionToImport);
					await transactions.updateTransaction(newTransaction);
				} else {
					// If new, create a new transaction
					const params: TransactionRecordParams = {
						locationId: null,
						isReconciled: false,
						tagIds: [],
						attachmentIds: [],
						...transactionToImport,
						title: transactionToImport.title?.trim() ?? null,
						notes: transactionToImport.notes?.trim() ?? null,
					};
					await transactions.createTransaction(newAccount, params);
				}
			}

			// Location data
			for (const locationToImport of accountToImport.locations ?? []) {
				const storedLocation = locations.items[locationToImport.id] ?? null;
				if (storedLocation) {
					// If duplicate, overwrite the one we have
					const newLocation = storedLocation.updatedWith(locationToImport);
					await locations.updateLocation(newLocation);
				} else {
					// If new, create a new location
					const params: LocationRecordParams = {
						coordinate: null,
						...locationToImport,
						title: locationToImport.title.trim(),
						subtitle: locationToImport.subtitle?.trim() ?? null,
					};
					await locations.createLocation(params);
				}
			}

			// Tag data
			for (const tagToImport of accountToImport.tags ?? []) {
				const storedTag = tags.items[tagToImport.id] ?? null;
				if (storedTag) {
					// If duplicate, overwrite the one we have
					const newTag = storedTag.updatedWith(tagToImport);
					await tags.updateTag(newTag);
				} else {
					// If new, create a new tag
					const params: TagRecordParams = {
						...tagToImport,
					};
					await tags.createTag(params);
				}
			}

			// File Attachments
			for (const attachmentToImport of accountToImport.attachments ?? []) {
				const storedAttachment = attachments.items[attachmentToImport.id];

				const path = `accountable/storage/${
					attachmentToImport.storagePath.split(".")[0] as string
				}/${attachmentToImport.title}`;
				const fileRef = zip.value?.files[path] ?? null;

				const blobToImport = (await fileRef?.async("blob")) ?? null;
				if (!blobToImport) continue;
				const fileToImport = new File([blobToImport], attachmentToImport.title.trim(), {
					type: attachmentToImport.type?.trim(),
				});

				if (storedAttachment) {
					// If duplicate, overwrite the one we have
					const newAttachment = storedAttachment.updatedWith(attachmentToImport);
					await attachments.updateAttachment(newAttachment, fileToImport);
				} else {
					// If new, create a new attachment
					const params: AttachmentRecordParams = {
						...attachmentToImport,
						title: attachmentToImport.title.trim(),
						type: attachmentToImport.type?.trim() ?? "unknown",
						notes: attachmentToImport.notes?.trim() ?? null,
					};
					await attachments.createAttachment(params, fileToImport);
				}
			}
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
