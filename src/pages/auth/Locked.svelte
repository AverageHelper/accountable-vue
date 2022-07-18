<script lang="ts">
	import { _ } from "svelte-i18n";
	import { accountsPath } from "../../router";
	import { onMount } from "svelte";
	import { useAuthStore, useUiStore } from "../../store";
	import { useRouter } from "vue-router";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import ErrorNotice from "../../components/ErrorNotice.svelte";
	import Footer from "../../Footer.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const auth = useAuthStore();
	const ui = useUiStore();
	const router = useRouter();

	$: bootstrapError = ui.bootstrapError;
	$: accountId = auth.accountId ?? "";
	let password = "";
	let isLoading = false;
	$: loginProcessState = auth.loginProcessState;

	let passwordField: TextField | undefined;

	onMount(() => {
		passwordField?.focus();
		ui.bootstrap();
	});

	async function submit() {
		try {
			isLoading = true;

			if (!accountId || !password) throw new Error($_("error.form.missing-required-fields"));

			await auth.unlockVault(password);

			await router.replace(accountsPath());
		} catch (error) {
			ui.handleError(error);
		} finally {
			isLoading = false;
		}
	}
</script>

{#if bootstrapError}
	<main class="content">
		<ErrorNotice error={bootstrapError} />
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
				shows-required={false}
				required
			/>
			<TextField
				bind:this={passwordField}
				bind:value={password}
				type="password"
				label={$_("login.current-passphrase")}
				placeholder="********"
				autocomplete="current-password"
				shows-required={false}
				required
			/>
			<ActionButton type="submit" kind="bordered-primary" disabled={isLoading}
				>{$_("locked.unlock")}</ActionButton
			>

			{#if loginProcessState === "AUTHENTICATING"}
				<span>{$_("login.process.reauthenticating")}</span>
			{/if}
			{#if loginProcessState === "GENERATING_KEYS"}
				<span>{$_("login.process.generating-keys")}</span>
			{/if}
			{#if loginProcessState === "FETCHING_KEYS"}
				<span>{$_("login.process.fetching-keys")}</span>
			{/if}
			{#if loginProcessState === "DERIVING_PKEY"}
				<span>{$_("login.process.deriving-pkey")}</span>
			{/if}
		</form>
		<Footer />
	</main>
{/if}
