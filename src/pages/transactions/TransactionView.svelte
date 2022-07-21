<script lang="ts">
	import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
	import type { Attachment } from "../../model/Attachment";
	import { _ } from "svelte-i18n";
	import { accountPath } from "../../router";
	import { addTagToTransaction, addAttachmentToTransaction } from "../../model/Transaction";
	import { intlFormat, toTimestamp } from "../../transformers";
	import { isNegative } from "dinero.js";
	import ConfirmDestroyFile from "../attachments/ConfirmDestroyFile.svelte";
	import EditButton from "../../components/buttons/EditButton.svelte";
	import FileInput from "../attachments/FileInput.svelte";
	import FileListItem from "../attachments/FileListItem.svelte";
	import FileReattach from "../attachments/FileReattach.svelte";
	import I18N from "../../components/I18N.svelte";
	import List from "../../components/List.svelte";
	import LocationIcon from "../../icons/Location.svelte";
	import LocationView from "../locations/LocationView.svelte";
	import Modal from "../../components/Modal.svelte";
	import NopLink from "../../components/NopLink.svelte";
	import NavAction from "../../components/NavAction.svelte";
	import TagList from "../../pages/tags/TagList.svelte";
	import TransactionEdit from "./TransactionEdit.svelte";
	import {
		accounts,
		attachments,
		createAttachmentFromFile,
		createTag as _createTag,
		deleteAttachment,
		deleteTagIfUnreferenced,
		handleError,
		locations,
		removeAttachmentFromTransaction,
		removeTagFromTransaction,
		transactionsForAccount,
		updateTransaction,
	} from "../../store";

	export let accountId: string;
	export let transactionId: string;

	let fileToDelete: Attachment | null = null;
	let isViewingLocation = false;
	let brokenReferenceToFix: string | null = null;

	$: theseTransactions = $transactionsForAccount[accountId] ?? {};

	$: numberOfTransactions = Object.keys(theseTransactions).length;
	$: account = $accounts[accountId];
	$: transaction = theseTransactions[transactionId];
	$: locationId = transaction?.locationId ?? null;
	$: location = locationId !== null ? $locations[locationId] ?? null : null;

	$: timestamp = !transaction //
		? ""
		: toTimestamp(transaction.createdAt);

	$: accountRoute = accountPath(accountId);

	function goBack() {
		window.history.back();
	}

	async function createTag(params: CustomEvent<TagRecordParams>) {
		if (!transaction) return;
		const newTag = await _createTag(params.detail);
		addTagToTransaction(transaction, newTag);
		await updateTransaction(transaction);
	}

	function modifyTag(tag: CustomEvent<TagObject>) {
		console.debug("modify", tag.detail);
	}

	async function removeTag(tag: CustomEvent<TagObject>) {
		if (!transaction) return;
		await removeTagFromTransaction(tag.detail, transaction);
		await deleteTagIfUnreferenced(tag.detail); // removing the tag won't automatically do this, for efficiency's sake, so we do it here
	}

	function askToDeleteFile(file: CustomEvent<Attachment>): void {
		fileToDelete = file.detail;
	}

	async function confirmDeleteFile(file: CustomEvent<Attachment>): Promise<void> {
		if (!transaction) return;
		try {
			await deleteAttachment(file.detail);
		} catch (error) {
			handleError(error);
		} finally {
			fileToDelete = null;
		}
	}

	function openReferenceFixer(fileId: string): void {
		brokenReferenceToFix = fileId;
	}

	function closeReferenceFixer(): void {
		brokenReferenceToFix = null;
	}

	async function deleteFileReference({ detail: fileId }: CustomEvent<string>): Promise<void> {
		if (!transaction) return;
		try {
			await removeAttachmentFromTransaction(fileId, transaction);
		} catch (error) {
			handleError(error);
		} finally {
			fileToDelete = null;
		}
	}

	function cancelDeleteFile(): void {
		fileToDelete = null;
	}

	async function onFileReceived(event: CustomEvent<File | null>): Promise<void> {
		const file = event.detail;
		if (!transaction || !file) return;

		try {
			const attachment = await createAttachmentFromFile(file);
			addAttachmentToTransaction(transaction, attachment);
			await updateTransaction(transaction);
		} catch (error) {
			handleError(error);
		}
	}
</script>

<!-- FIXME: Make this match the account view, with the button beside the title -->
{#if account && transaction}
	<NavAction>
		<EditButton slot="modal" let:onFinished>
			<TransactionEdit {account} {transaction} on:deleted={goBack} on:finished={onFinished} />
		</EditButton>
	</NavAction>
{/if}

{#if transaction}
	<main class="content">
		{#if transaction.title || location}
			<div class="heading">
				<h1>&quot;{transaction.title ?? location?.title}&quot;</h1>
				<!-- TODO: Default to the transaction ID -->
			</div>
		{/if}

		<TagList
			tagIds={transaction.tagIds ?? []}
			on:create-tag={createTag}
			on:modify-tag={modifyTag}
			on:remove-tag={removeTag}
		/>

		<!-- TODO: I18N -->
		<h3>Details</h3>
		<!-- Amount -->
		<div class="key-value-pair" aria-label="Transaction Amount">
			<span class="key">Amount</span>
			<span class="value amount {isNegative(transaction.amount) ? 'negative' : ''}"
				>{intlFormat(transaction.amount, "standard")}</span
			>
		</div>
		<!-- Timestamp -->
		<div class="key-value-pair" aria-label="Transaction Timestamp">
			<span class="key">Timestamp</span>
			<span class="value">{timestamp}</span>
		</div>
		<!-- Reconciliation -->
		<div class="key-value-pair" aria-label="Is Transaction Reconciled?">
			<span class="key">Reconciled</span>
			<span class="value">{transaction.isReconciled ? "Yes" : "No"}</span>
		</div>
		<!-- Account -->
		<div class="key-value-pair" aria-label="Transaction Account">
			<span class="key">Account</span>
			<a href={accountRoute} class="value">{account?.title ?? accountId}</a>
		</div>
		<!-- Notes -->
		{#if transaction.notes}
			<div class="key-value-pair" aria-label="Transaction Notes">
				<span class="key">Notes</span>
				<span class="value">&quot;{transaction.notes}&quot;</span>
			</div>
		{/if}
		<!-- Location -->
		{#if locationId}
			<div class="key-value-pair" aria-label="Transaction Location">
				<span class="key">Location</span>
				{#if location?.coordinate ?? location?.subtitle}
					<NopLink class="value" on:click={() => (isViewingLocation = true)}
						>{location?.title ?? locationId}
						{#if location?.coordinate}<LocationIcon />{/if}
					</NopLink>
				{:else}
					<span class="value">&quot;{location?.title ?? locationId}&quot;</span>
				{/if}
				<Modal open={isViewingLocation} close-modal={() => (isViewingLocation = false)}>
					{#if location}
						<LocationView {location} />
					{/if}
				</Modal>
			</div>
		{/if}

		<h3>Files</h3>
		<List>
			{#each transaction.attachmentIds as fileId}
				<li>
					{#if $attachments[fileId]}
						<FileListItem
							{fileId}
							on:delete={askToDeleteFile}
							on:delete-reference={deleteFileReference}
						/>
					{:else}
						<FileListItem
							{fileId}
							on:click={e => {
								e.preventDefault();
								openReferenceFixer(fileId);
							}}
						/>
					{/if}
				</li>
			{/each}
		</List>
		<FileInput on:input={onFileReceived}>Attach a file</FileInput>
	</main>
{:else}
	<main>
		<!-- We should never get here, but in case we do, for debugging: -->
		<h1>{$_("debug.something-is-wrong")}</h1>
		<p>{$_("debug.account-but-no-transaction")}</p>
		<I18N keypath="debug.transaction-id" tag="p" class="disclaimer">
			<em slot="id">{transactionId}</em>
		</I18N>
		<p class="disclaimer"
			>{numberOfTransactions === 1
				? $_("debug.count-one-transaction")
				: $_("debug.count-all-transactions", { values: { n: numberOfTransactions } })}</p
		>
		<ul>
			{#each Object.entries(theseTransactions) as [id, txn] (id)}
				<li>
					<strong>{id}:&nbsp;</strong>
					<span>{txn.id}</span>
				</li>
			{/each}
		</ul>
	</main>
{/if}

<Modal open={brokenReferenceToFix !== null && !!transaction} close-modal={closeReferenceFixer}>
	{#if brokenReferenceToFix !== null && !!transaction}
		<FileReattach {transaction} fileId={brokenReferenceToFix} on:close={closeReferenceFixer} />
	{/if}
</Modal>

<ConfirmDestroyFile
	file={fileToDelete}
	isOpen={fileToDelete !== null}
	on:yes={confirmDeleteFile}
	on:no={cancelDeleteFile}
/>

<style type="text/scss">
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
