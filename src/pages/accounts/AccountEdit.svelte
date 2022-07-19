<script lang="ts">
	import type { Account } from "../../model/Account";
	import { _ } from "svelte-i18n";
	import { account as newAccount } from "../../model/Account";
	import { createEventDispatcher, onMount } from "svelte";
	import { useAccountsStore, useTransactionsStore, useUiStore } from "../../store";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import TextAreaField from "../../components/inputs/TextAreaField.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const dispatch = createEventDispatcher<{
		deleted: void;
		finished: void;
	}>();

	export let account: Account | null = null;

	const accounts = useAccountsStore();
	const transactions = useTransactionsStore();
	const ui = useUiStore();

	$: isCreatingAccount = account === null;
	$: numberOfTransactions = !account
		? 0
		: Object.keys(transactions.transactionsForAccount[account.id] ?? {}).length;

	let isLoading = false;
	let title = "";
	let notes = "";
	// $: createdAt = props.account.createdAt ?? new Date();

	let titleField: TextField | undefined;

	onMount(() => {
		// Opened, if we're modal
		title = account?.title ?? "";
		notes = account?.notes ?? "";
		titleField?.focus();
	});

	async function submit() {
		isLoading = true;

		try {
			if (!title) {
				throw new Error($_("error.form.missing-required-fields"));
			}

			if (account === null) {
				await accounts.createAccount({
					createdAt: new Date(),
					title: title.trim(),
					notes: notes.trim(),
				});
			} else {
				await accounts.updateAccount(
					newAccount({
						id: account.id,
						title: title.trim(),
						notes: notes.trim() || account.notes.trim(),
						createdAt: account.createdAt,
					})
				);
			}

			dispatch("finished");
		} catch (error) {
			ui.handleError(error);
		}

		isLoading = false;
	}

	async function deleteAccount(event: Event) {
		event.preventDefault();
		isLoading = true;

		try {
			if (account === null) {
				throw new Error("No account to delete"); // TODO: I18N
			}

			await accounts.deleteAccount(account);
			dispatch("deleted");
			dispatch("finished");
		} catch (error) {
			ui.handleError(error);
		}

		isLoading = false;
	}
</script>

<form on:submit|preventDefault={submit}>
	<!-- TODO: I18N -->
	{#if isCreatingAccount}
		<h1>Create Account</h1>
	{:else}
		<h1>Edit {account?.title ?? "Account"}</h1>
	{/if}

	<TextField
		bind:this={titleField}
		value={title}
		label="title"
		placeholder="Bank Money"
		required
		on:input={e => (title = e.detail)}
	/>
	<TextAreaField
		value={notes}
		label="notes"
		placeholder="This is a thing"
		on:input={e => (notes = e.detail)}
	/>

	<ActionButton type="submit" kind="bordered-primary" disabled={isLoading}>Save</ActionButton>
	{#if !isCreatingAccount && numberOfTransactions === 0}
		<ActionButton kind="bordered-destructive" disabled={isLoading} on:click={deleteAccount}
			>Delete {account?.title ?? "Account"}</ActionButton
		>
	{/if}
	{#if isLoading}
		<p>Saving...</p>
	{/if}
</form>

<style type="text/scss">
	form {
		align-items: center;

		> label {
			width: 80%;
		}
	}
</style>
