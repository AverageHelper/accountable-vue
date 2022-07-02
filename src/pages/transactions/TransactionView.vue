<script setup lang="ts">
import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
import type { Attachment } from "../../model/Attachment";
import type { Location } from "../../model/Location";
import type { Transaction } from "../../model/Transaction";
import ConfirmDestroyFile from "../attachments/ConfirmDestroyFile.vue";
import EditButton from "../../components/buttons/EditButton.vue";
import FileInput from "../attachments/FileInput.vue";
import FileListItem from "../attachments/FileListItem.vue";
import FileReattach from "../attachments/FileReattach.vue";
import List from "../../components/List.vue";
import LocationIcon from "../../icons/Location.vue";
import LocationView from "../locations/LocationView.vue";
import Modal from "../../components/Modal.vue";
import NavAction from "../../components/NavAction.vue";
import TagList from "../../pages/tags/TagList.vue";
import TransactionEdit from "./TransactionEdit.vue";
import { accountPath } from "../../router";
import { addTagToTransaction, addAttachmentToTransaction } from "../../model/Transaction";
import { ref, computed, toRefs } from "vue";
import { intlFormat, toTimestamp } from "../../transformers";
import { isNegative } from "dinero.js";
import { useRouter } from "vue-router";
import {
	useAccountsStore,
	useAttachmentsStore,
	useLocationsStore,
	useTagsStore,
	useTransactionsStore,
	useUiStore,
} from "../../store";

const props = defineProps({
	accountId: { type: String, required: true },
	transactionId: { type: String, required: true },
});
const { accountId, transactionId } = toRefs(props);

const router = useRouter();
const accounts = useAccountsStore();
const attachments = useAttachmentsStore();
const locations = useLocationsStore();
const transactions = useTransactionsStore();
const tags = useTagsStore();
const ui = useUiStore();

const fileToDelete = ref<Attachment | null>(null);
const isViewingLocation = ref(false);
const brokenReferenceToFix = ref<string | null>(null);

const theseTransactions = computed(
	() => (transactions.transactionsForAccount[accountId.value] ?? {}) as Dictionary<Transaction>
);
const numberOfTransactions = computed(() => Object.keys(theseTransactions.value).length);
const account = computed(() => accounts.items[accountId.value]);
const transaction = computed(() => theseTransactions.value[transactionId.value]);
const locationId = computed(() => transaction.value?.locationId ?? null);
const location = computed<Location | null>(() =>
	locationId.value !== null ? locations.items[locationId.value] ?? null : null
);

const timestamp = computed(() => {
	if (!transaction.value) return "";
	return toTimestamp(transaction.value.createdAt);
});

const accountRoute = computed(() => accountPath(accountId.value));

function goBack() {
	router.back();
}

async function createTag(params: TagRecordParams) {
	if (!transaction.value) return;
	const newTag = await tags.createTag(params);
	addTagToTransaction(transaction.value, newTag);
	await transactions.updateTransaction(transaction.value);
}

function modifyTag(tag: TagObject) {
	console.debug("modify", tag);
}

async function removeTag(tag: TagObject) {
	if (!transaction.value) return;
	await transactions.removeTagFromTransaction(tag, transaction.value);
	await transactions.deleteTagIfUnreferenced(tag); // removing the tag won't automatically do this, for efficiency's sake, so we do it here
}

function askToDeleteFile(file: Attachment) {
	fileToDelete.value = file;
}

async function confirmDeleteFile(file: Attachment) {
	if (!transaction.value) return;
	try {
		await attachments.deleteAttachment(file);
	} catch (error) {
		ui.handleError(error);
	} finally {
		fileToDelete.value = null;
	}
}

function openReferenceFixer(fileId: string) {
	brokenReferenceToFix.value = fileId;
}

function closeReferenceFixer() {
	brokenReferenceToFix.value = null;
}

async function deleteFileReference(fileId: string) {
	if (!transaction.value) return;
	try {
		await transactions.removeAttachmentFromTransaction(fileId, transaction.value);
	} catch (error) {
		ui.handleError(error);
	} finally {
		fileToDelete.value = null;
	}
}

function cancelDeleteFile() {
	fileToDelete.value = null;
}

async function onFileReceived(file: File) {
	if (!transaction.value) return;

	try {
		const attachment = await attachments.createAttachmentFromFile(file);
		addAttachmentToTransaction(transaction.value, attachment);
		await transactions.updateTransaction(transaction.value);
	} catch (error) {
		ui.handleError(error);
	}
}
</script>

<template>
	<!-- FIXME: Make this match the account view, with the button beside the title -->
	<NavAction v-if="account && transaction">
		<EditButton>
			<template #modal="{ onFinished }">
				<TransactionEdit
					:account="account"
					:transaction="transaction"
					@deleted="goBack"
					@finished="onFinished"
				/>
			</template>
		</EditButton>
	</NavAction>

	<main v-if="transaction" class="content">
		<div v-if="transaction.title || location" class="heading">
			<h1>&quot;{{ transaction.title ?? location?.title }}&quot;</h1>
			<!-- TODO: Default to the transaction ID -->
		</div>

		<TagList
			:tag-ids="transaction.tagIds ?? []"
			@create-tag="createTag"
			@modify-tag="modifyTag"
			@remove-tag="removeTag"
		/>

		<!-- TODO: I18N -->
		<h3>Details</h3>
		<!-- Amount -->
		<div class="key-value-pair" aria-label="Transaction Amount">
			<span class="key">Amount</span>
			<span class="value amount" :class="{ negative: isNegative(transaction.amount) }">{{
				intlFormat(transaction.amount, "standard")
			}}</span>
		</div>
		<!-- Timestamp -->
		<div class="key-value-pair" aria-label="Transaction Timestamp">
			<span class="key">Timestamp</span>
			<span class="value">{{ timestamp }}</span>
		</div>
		<!-- Account -->
		<div class="key-value-pair" aria-label="Transaction Account">
			<span class="key">Account</span>
			<router-link :to="accountRoute" class="value">{{ account?.title ?? accountId }}</router-link>
		</div>
		<!-- Notes -->
		<div v-if="transaction.notes" class="key-value-pair" aria-label="Transaction Notes">
			<span class="key">Notes</span>
			<span class="value">&quot;{{ transaction.notes }}&quot;</span>
		</div>
		<!-- Location -->
		<div v-if="locationId" class="key-value-pair" aria-label="Transaction Location">
			<span class="key">Location</span>
			<a
				v-if="location?.coordinate || location?.subtitle"
				href="#"
				class="value"
				@click.prevent="isViewingLocation = true"
				>{{ location?.title ?? locationId }} <LocationIcon v-if="location?.coordinate" />
			</a>
			<span v-else class="value">&quot;{{ location?.title ?? locationId }}&quot;</span>
			<Modal :open="isViewingLocation" :close-modal="() => (isViewingLocation = false)">
				<LocationView v-if="location" :location="location" />
			</Modal>
		</div>

		<h3>Files</h3>
		<List>
			<li v-for="fileId in transaction.attachmentIds" :key="fileId">
				<FileListItem
					v-if="attachments.items[fileId]"
					:file-id="fileId"
					@delete="askToDeleteFile"
					@delete-reference="deleteFileReference"
				/>
				<FileListItem v-else :file-id="fileId" @click.prevent="() => openReferenceFixer(fileId)" />
			</li>
		</List>
		<FileInput @input="onFileReceived">Attach a file</FileInput>
	</main>
	<main v-else>
		<!-- We should never get here, but in case we do, for debugging: -->
		<h1>{{ $t("debug.something-is-wrong") }}</h1>
		<p>{{ $t("debug.account-but-no-transaction") }}</p>
		<i18n-t keypath="debug.transaction-id" tag="p" class="disclaimer">
			<template #id>
				<em>{{ transactionId }}</em>
			</template>
		</i18n-t>
		<p class="disclaimer">{{
			$tc("debug.count-all-transactions", numberOfTransactions, { n: numberOfTransactions })
		}}</p>
		<ul>
			<li v-for="(txn, id) in theseTransactions" :key="id">
				<strong>{{ id }}:&nbsp;</strong>
				<span>{{ txn.id }}</span>
			</li>
		</ul>
	</main>

	<Modal :open="brokenReferenceToFix !== null && !!transaction" :close-modal="closeReferenceFixer">
		<FileReattach
			v-if="brokenReferenceToFix !== null && !!transaction"
			:transaction="transaction"
			:file-id="brokenReferenceToFix"
			@close="closeReferenceFixer"
		/>
	</Modal>

	<ConfirmDestroyFile
		:file="fileToDelete"
		:is-open="fileToDelete !== null"
		@yes="confirmDeleteFile"
		@no="cancelDeleteFile"
	/>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.content {
	max-width: 400pt;
	margin: 0 auto;

	.amount {
		&.negative {
			color: color($red);
		}
	}

	.key-value-pair {
		width: 100%;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;

		> .key {
			flex: 0 0 auto; // don't grow, take up only needed space
		}

		&::after {
			content: "";
			min-width: 0.5em;
			height: 1em;
			margin: 0 2pt;
			border-bottom: 1pt dotted color($label);
			flex: 1 0 auto; // Grow, don't shrink
			order: 1; // this goes in the middle
		}

		> .value {
			text-align: right;
			font-weight: bold;
			white-space: pre-wrap;
			max-width: 80%;
			flex: 0 0 auto; // don't grow, take up only needed space
			order: 2;
		}
	}
}
</style>
