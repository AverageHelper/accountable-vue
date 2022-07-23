<script lang="ts">
	import type { Attachment } from "../../model/Attachment";
	import { allTransactions, imageDataFromFile } from "../../store";
	import { createEventDispatcher } from "svelte";
	import { toTimestamp } from "../../transformers";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import DownloadButton from "../../components/buttons/DownloadButton.svelte";
	import ErrorNotice from "../../components/ErrorNotice.svelte";
	import List from "../../components/List.svelte";
	import TransactionListItem from "../transactions/TransactionListItem.svelte";
	import TrashIcon from "../../icons/Trash.svelte";

	export let file: Attachment | null = null;

	const dispatch = createEventDispatcher<{
		delete: Attachment;
		"delete-reference": void;
	}>();

	let imageUrl: string | null = null;
	let imageLoadError: Error | null = null;
	$: linkedTransactions = $allTransactions.filter(
		t => file !== null && t.attachmentIds.includes(file?.id)
	);
	$: transactionCount = linkedTransactions.length;
	$: timestamp = !file ? "now" : toTimestamp(file.createdAt);

	async function loadNewData(file: Attachment) {
		try {
			imageUrl = await imageDataFromFile(file);
		} catch (error) {
			imageLoadError = error as Error;
		}
	}

	$: {
		// Forget old value
		imageUrl = null;
		imageLoadError = null;

		if (file) void loadNewData(file);
	}

	function askToDelete(event: Event) {
		event.preventDefault();
		if (file) {
			dispatch("delete", file); // get rid of the file
		} else {
			dispatch("delete-reference"); // get rid of the file reference
		}
	}
</script>

<!-- TODO: I18N -->

<div class="main-5978c5a2">
	{#if !file}
		<p>This file does not exist. Sorry.</p>
	{:else if imageLoadError}
		<ErrorNotice error={imageLoadError} />
	{:else if !imageUrl}
		<p>Loading...</p>
	{:else}
		<img src={imageUrl} alt="Stored file" />
	{/if}
</div>

<div>
	{#if file}
		<p>Name: <strong>{file.title}</strong></p>
		<p>Type: <strong>{file.type}</strong></p>
		<p>Timestamp: <strong>{timestamp}</strong></p>
	{/if}
</div>

{#if transactionCount > 0}
	<div>
		<h3>Linked Transaction{transactionCount !== 1 ? "s" : ""}</h3>
		<List class="files-5978c5a2">
			{#each linkedTransactions as transaction (transaction.id)}
				<li>
					<TransactionListItem {transaction} />
				</li>
			{/each}
		</List>
	</div>
{/if}

<h3>Actions</h3>
<div class="buttons-5978c5a2">
	{#if file}
		<DownloadButton class="download" {file} />
	{/if}

	{#if file}
		<ActionButton class="delete" kind="bordered-destructive" on:click={askToDelete}>
			<TrashIcon /> Delete</ActionButton
		>
	{:else}
		<ActionButton class="delete" kind="bordered" on:click={askToDelete}>
			<TrashIcon /> Remove this dead reference</ActionButton
		>
	{/if}
</div>

<style lang="scss" global>
	.main-5978c5a2 {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		justify-content: center;
		margin-bottom: 1em;

		img {
			max-width: 100%;
		}
	}

	.files-5978c5a2 {
		> li {
			overflow: hidden;
			border-radius: 4pt;
		}
	}

	.buttons-5978c5a2 {
		display: flex;
		flex-flow: row nowrap;

		> button {
			margin-top: 0;
		}

		> .download {
			margin-right: 8pt;
		}

		> .delete {
			margin-left: auto;

			.icon {
				margin-right: 6pt;
			}
		}
	}
</style>
