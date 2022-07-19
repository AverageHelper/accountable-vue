<script lang="ts">
	import type { Attachment } from "../../model/Attachment";
	import { createEventDispatcher } from "svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Confirm from "../../components/Confirm.svelte";

	const dispatch = createEventDispatcher<{
		yes: Attachment;
		no: Attachment;
	}>();

	export let file: Attachment | null = null;
	export let isOpen: boolean;

	function no() {
		if (file) {
			dispatch("no", file);
		}
	}

	function yes() {
		if (file) {
			dispatch("yes", file);
		}
	}
</script>

<Confirm {isOpen} closeModal={no}>
	<!-- TODO: I18N -->
	<span slot="message"
		>Are you sure you want to delete {#if file}<strong>{file.title}</strong>{:else}<span
				>this file</span
			>{/if}? This cannot be undone.</span
	>

	<ActionButton slot="primary-action" kind="bordered-destructive" on:click={yes}>Yes</ActionButton>

	<ActionButton slot="secondary-action" kind="bordered-primary" on:click={no}>No</ActionButton>
</Confirm>
