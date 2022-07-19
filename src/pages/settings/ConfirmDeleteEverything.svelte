<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Confirm from "../../components/Confirm.svelte";

	const dispatch = createEventDispatcher<{
		yes: void;
		no: void;
	}>();

	export let isOpen: boolean;

	function no() {
		dispatch("no");
	}

	function yes() {
		dispatch("yes");
	}
</script>

<Confirm {isOpen} closeModal={no}>
	<!-- TODO: I18N -->
	<span slot="message"
		>Are you sure you want to delete <strong>all of your data</strong>? This cannot be undone.</span
	>

	<ActionButton slot="primary-action" kind="bordered-destructive" on:click={yes}>Yes</ActionButton>
	<ActionButton slot="secondary-action" kind="bordered-primary" on:click={no}>No</ActionButton>
</Confirm>
