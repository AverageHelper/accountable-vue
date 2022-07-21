<script lang="ts">
	import { _ } from "svelte-i18n";
	import { accountsPath } from "../../router";
	import { navigateTo } from "svelte-router-spa";
	import { onMount } from "svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import ErrorNotice from "../../components/ErrorNotice.svelte";
	import Footer from "../../Footer.svelte";
	import TextField from "../../components/inputs/TextField.svelte";
	import {
		accountId as _accountId,
		bootstrap,
		bootstrapError,
		handleError,
		loginProcessState,
		unlockVault,
	} from "../../store";

	$: accountId = $_accountId ?? "";
	let password = "";
	let isLoading = false;

	let passwordField: TextField | undefined;

	onMount(() => {
		passwordField?.focus();
		bootstrap();
	});

	async function submit() {
		try {
			isLoading = true;

			if (!accountId || !password) throw new Error($_("error.form.missing-required-fields"));

			await unlockVault(password);

			navigateTo(accountsPath(), undefined, true);
		} catch (error) {
			handleError(error);
		} finally {
			isLoading = false;
		}
	}
</script>

{#if $bootstrapError}
	<main class="content">
		<ErrorNotice error={$bootstrapError} />
		<Footer />
	</main>
{:else}
	<main class="content">
		<form on:submit|preventDefault={submit}>
			<p>{$_("locked.heading")}</p>

			<TextField
				value={accountId}
				disabled={true}
				label={$_("login.account-id")}
				autocomplete="username"
				showsRequired={false}
				required
			/>
			<TextField
				bind:this={passwordField}
				bind:value={password}
				type="password"
				label={$_("login.current-passphrase")}
				placeholder="********"
				autocomplete="current-password"
				showsRequired={false}
				required
			/>
			<ActionButton type="submit" kind="bordered-primary" disabled={isLoading}
				>{$_("locked.unlock")}</ActionButton
			>

			{#if $loginProcessState === "AUTHENTICATING"}
				<span>{$_("login.process.reauthenticating")}</span>
			{/if}
			{#if $loginProcessState === "GENERATING_KEYS"}
				<span>{$_("login.process.generating-keys")}</span>
			{/if}
			{#if $loginProcessState === "FETCHING_KEYS"}
				<span>{$_("login.process.fetching-keys")}</span>
			{/if}
			{#if $loginProcessState === "DERIVING_PKEY"}
				<span>{$_("login.process.deriving-pkey")}</span>
			{/if}
		</form>
		<Footer />
	</main>
{/if}
