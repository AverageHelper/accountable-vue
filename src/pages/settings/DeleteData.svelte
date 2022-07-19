<script lang="ts">
	import { _ } from "svelte-i18n";
	import { logoutPath } from "../../router";
	import { useAuthStore, useUiStore } from "../../store";
	import { useRouter } from "vue-router";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import ConfirmDeleteEverything from "./ConfirmDeleteEverything.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const auth = useAuthStore();
	const ui = useUiStore();
	const router = useRouter();

	$: accountId = auth.accountId;
	let password = "";
	let isAskingToDelete = false;
	let isDeleting = false;

	$: hasChanges = password !== "";

	function reset(event: Event) {
		event.preventDefault();
		password = "";
	}

	function askToDeleteEverything() {
		isAskingToDelete = true;
	}

	async function confirmDeleteEverything() {
		isAskingToDelete = false;
		isDeleting = true;

		try {
			if (!password) throw new Error($_("error.form.missing-required-fields"));
			await auth.destroyVault(password);

			await router.push(logoutPath());
		} catch (error) {
			ui.handleError(error);
			isDeleting = false;
		}
	}

	function cancelDeleteEverything() {
		isAskingToDelete = false;
	}
</script>

<form on:submit|preventDefault={askToDeleteEverything}>
	<!-- TODO: I18N -->
	<h3>Delete Everything</h3>
	<p>You have the option to delete all of your data on Accountable.</p>

	<TextField
		value={accountId ?? "b4dcb93bc0c04251a930541e1a3c9a80"}
		type="text"
		label="account ID"
		disabled
	/>
	<TextField
		value={password}
		on:input={e => (password = e.detail)}
		type="password"
		label="current passphrase"
		placeholder="********"
		autocomplete="current-password"
		showsRequired={false}
		required
	/>

	<div class="buttons">
		<ActionButton type="submit" kind="bordered-destructive" disabled={!hasChanges || isDeleting}>
			{#if isDeleting}
				<span>Deleting...</span>
			{:else}
				<span>Delete Everything</span>
			{/if}
		</ActionButton>
		{#if hasChanges}
			<ActionButton kind="bordered" disabled={isDeleting} on:click={reset}>Reset</ActionButton>
		{/if}
	</div>
</form>

<ConfirmDeleteEverything
	isOpen={isAskingToDelete}
	on:yes={confirmDeleteEverything}
	on:no={cancelDeleteEverything}
/>

<style type="text/scss">
	.buttons {
		display: flex;
		flex-flow: row nowrap;

		:not(:last-child) {
			margin-right: 8pt;
		}
	}
</style>
