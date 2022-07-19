<script lang="ts">
	import type { Attachment } from "../../model/Attachment";
	import { createEventDispatcher } from "svelte";
	import { toTimestamp } from "../../transformers";
	import { useAttachmentsStore } from "../../store";
	import FileView from "./FileView.svelte";
	import ListItem from "../../components/ListItem.svelte";
	import Modal from "../../components/Modal.svelte";

	const dispatch = createEventDispatcher<{
		delete: Attachment;
		"delete-reference": string;
		click: Event;
	}>();

	export let fileId: string;

	const attachments = useAttachmentsStore();

	$: file = attachments.items[fileId];
	$: title = file?.title ?? fileId;
	$: timestamp = toTimestamp(file.createdAt);
	$: subtitle = !file
		? "Broken reference" // TODO: I18N
		: file.notes === null || !file.notes
		? timestamp
		: `${file.notes} - ${timestamp}`;

	let isModalOpen = false;

	function presentImageModal(event: Event) {
		event.preventDefault();
		dispatch("click", event);
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

	function askToDelete(file: CustomEvent<Attachment>) {
		dispatch("delete", file.detail);
	}

	function askToDeleteReference() {
		dispatch("delete-reference", fileId);
	}
</script>

<ListItem {title} {subtitle} to="" on:click={presentImageModal} />
<Modal open={isModalOpen && !!file} {closeModal}>
	<FileView {file} on:delete={askToDelete} on:deleteReference={askToDeleteReference} />
</Modal>
