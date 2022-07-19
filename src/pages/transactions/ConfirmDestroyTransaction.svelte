<script lang="ts">
	import type { Transaction } from "../../model/Transaction";
	import { createEventDispatcher } from "svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Confirm from "../../components/Confirm.svelte";

	const dispatch = createEventDispatcher<{
		yes: Transaction;
		no: Transaction;
	}>();

	export let transaction: Transaction;
	export let isOpen: boolean;

	function no() {
		dispatch("no", transaction);
	}

	function yes() {
		dispatch("yes", transaction);
	}
</script>

<Confirm {isOpen} closeModal={no}>
	<!-- TODO: I18N -->
	<span slot="message"
		>Are you sure you want to delete <strong>{transaction.title ?? ""}</strong>? This cannot be
		undone.</span
	>

	<ActionButton slot="primary-action" kind="bordered-destructive" on:click={yes}>Yes</ActionButton>
	<ActionButton slot="secondary-action" kind="bordered-primary" on:click={no}>No</ActionButton>
	<!-- <ActionButton slot="cancel-action" kind="bordered-secondary" on:click={no}>Cancel</ActionButton> -->
</Confirm>
