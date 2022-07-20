<script lang="ts">
	import type { Attachment } from "../../model/Attachment";
	import { allAttachments, deleteAttachment, handleError } from "../../store";
	import ConfirmDestroyFile from "./ConfirmDestroyFile.svelte";
	import FileListItem from "./FileListItem.svelte";
	import List from "../../components/List.svelte";

	$: numberOfFiles = $allAttachments.length;

	let fileToDelete: Attachment | null = null;

	function askToDeleteFile(file: CustomEvent<Attachment>) {
		fileToDelete = file.detail;
	}

	async function confirmDeleteFile(file: CustomEvent<Attachment>) {
		try {
			await deleteAttachment(file.detail);
		} catch (error) {
			handleError(error);
		} finally {
			fileToDelete = null;
		}
	}

	function cancelDeleteFile() {
		fileToDelete = null;
	}
</script>

<main class="content">
	<div class="heading">
		<!-- TODO: I18N -->
		<h1>Files</h1>
		<p>To add a file, attach it to a transaction.</p>
	</div>

	<List>
		{#each $allAttachments as file (file.id)}
			<li>
				<FileListItem fileId={file.id} on:delete={askToDeleteFile} />
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
</main>

<ConfirmDestroyFile
	file={fileToDelete}
	isOpen={fileToDelete !== null}
	on:yes={confirmDeleteFile}
	on:no={cancelDeleteFile}
/>

<style type="text/scss">
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
