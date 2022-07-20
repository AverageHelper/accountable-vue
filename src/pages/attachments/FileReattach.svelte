<script lang="ts">
	import type { Attachment } from "../../model/Attachment";
	import type { Transaction } from "../../model/Transaction";
	import { createEventDispatcher } from "svelte";
	import FileInput from "./FileInput.svelte";
	import FileListItem from "./FileListItem.svelte";
	import List from "../../components/List.svelte";
	import ListItem from "../../components/ListItem.svelte";
	import {
		addAttachmentToTransaction,
		transaction as copy,
		removeAttachmentIdFromTransaction,
	} from "../../model/Transaction";
	import {
		allAttachments,
		createAttachmentFromFile,
		handleError,
		updateTransaction,
	} from "../../store";

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let transaction: Transaction;
	export let fileId: string;

	$: numberOfFiles = $allAttachments.length;

	async function selectNewFile(attachment: Attachment) {
		const newTransaction = copy(transaction);
		addAttachmentToTransaction(newTransaction, attachment);
		removeAttachmentIdFromTransaction(newTransaction, fileId);
		await updateTransaction(newTransaction);
		dispatch("close");
	}

	async function createNewFile(event: CustomEvent<File | null>): Promise<void> {
		const file = event.detail;
		if (!file) return;

		try {
			const attachment = await createAttachmentFromFile(file);
			await selectNewFile(attachment);
		} catch (error) {
			handleError(error);
		}
	}
</script>

<div>
	<!-- TODO: I18N -->
	<h3>Fix broken reference</h3>
	<p
		>This attachment somehow got lost in the mix, possibly due to an import bug. Select the correct
		file below:</p
	>

	<List>
		<li>
			<FileInput on:input={createNewFile} let:click>
				<ListItem
					title="Upload a file"
					to=""
					on:click={e => {
						e.preventDefault();
						click();
					}}
				/>
			</FileInput>
		</li>
		{#each $allAttachments as file (file.id)}
			<li>
				<FileListItem
					fileId={file.id}
					on:click={e => {
						e.preventDefault();
						selectNewFile(file);
					}}
				/>
			</li>
		{/each}
		{#if numberOfFiles > 0}
			<li>
				<p class="footer"
					>{numberOfFiles} file{#if numberOfFiles !== 1}s{/if}</p
				>
			</li>
		{/if}
	</List>
</div>
