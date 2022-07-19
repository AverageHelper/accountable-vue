<script lang="ts">
	import type { Tag } from "../../model/Tag";
	import { createEventDispatcher } from "svelte";
	import { numberOfReferencesForTag } from "../../store";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Confirm from "../../components/Confirm.svelte";

	const dispatch = createEventDispatcher<{
		yes: Tag;
		no: Tag;
	}>();

	export let tag: Tag;
	export let isOpen: boolean;

	$: count = numberOfReferencesForTag(tag.id);

	function no() {
		dispatch("no", tag);
	}

	function yes() {
		dispatch("yes", tag);
	}
</script>

<Confirm {isOpen} closeModal={no}>
	<!-- TODO: I18N -->
	<span slot="message"
		>Are you sure you want to delete the tag <strong class="tag-name">{tag.name}</strong>?
		{#if count > 0}
			This tag will be removed from
			<strong>{count} transaction(s)</strong>.{/if}
		This cannot be undone.</span
	>

	<ActionButton slot="primary-action" kind="bordered-destructive" on:click={yes}>Yes</ActionButton>
	<ActionButton slot="secondary-action" kind="bordered-primary" on:click={no}>No</ActionButton>
	<!-- <ActionButton slot="cancel-action" kind="bordered-secondary" on:click={no}>Cancel</ActionButton> -->
</Confirm>

<style type="text/scss">
	.tag-name {
		&::before {
			content: "#";
		}
	}
</style>
