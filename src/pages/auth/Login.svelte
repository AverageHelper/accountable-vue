<script lang="ts">
	import type { CurrentRoute } from "svelte-router-spa/types/components/route";
	import { _ } from "svelte-i18n";
	import { accountsPath, loginPath, signupPath } from "../../router";
	import { navigateTo } from "svelte-router-spa";
	import { onMount } from "svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import ErrorNotice from "../../components/ErrorNotice.svelte";
	import Footer from "../../Footer.svelte";
	import NopLink from "../../components/NopLink.svelte";
	import TextField from "../../components/inputs/TextField.svelte";
	import {
		bootstrap,
		bootstrapError,
		createAccountId,
		createVault,
		handleError,
		isSignupEnabled,
		login,
		loginProcessState,
		uid,
	} from "../../store";

	export let currentRoute: CurrentRoute;

	$: isLoggedIn = $uid !== null;
	let accountId = "";
	let password = "";
	let passwordRepeat = "";
	let isLoading = false;
	$: mode = !isSignupEnabled
		? "login" // can't sign up? log in instead.
		: currentRoute.path === signupPath()
		? "signup"
		: "login";
	$: isSignupMode = mode === "signup";
	$: isLoginMode = mode === "login";

	let accountIdField: TextField | undefined;
	let passwordField: TextField | undefined;

	onMount(() => {
		accountIdField?.focus();
		bootstrap();
	});

	$: switch (mode) {
		case "login":
			accountIdField?.focus();
			break;
		case "signup":
			passwordField?.focus();
			break;
	}

	$: if (isLoggedIn) {
		navigateTo(accountsPath());
	} else if (currentRoute.path !== loginPath() && currentRoute.path !== signupPath()) {
		switch (mode) {
			case "login":
				navigateTo(loginPath());
				break;
			case "signup":
				navigateTo(signupPath());
				break;
		}
	}

	function enterSignupMode() {
		accountId = "";
		navigateTo(signupPath(), undefined, true);
	}

	function enterLoginMode() {
		accountId = "";
		navigateTo(loginPath(), undefined, true);
	}

	function onUpdateAccountId(newId: string) {
		if (!isSignupMode || isLoading) {
			accountId = newId;
		}
	}

	async function submit() {
		try {
			isLoading = true;
			if (isSignupMode) {
				// Don't let the user pick their own account ID
				accountId = createAccountId();
			}

			if (!accountId || !password || (isSignupMode && !passwordRepeat))
				throw new Error($_("error.form.missing-required-fields"));
			if (isSignupMode && password !== passwordRepeat)
				throw new Error($_("error.form.password-mismatch"));

			switch (mode) {
				case "signup":
					await createVault(accountId, password);
					break;

				case "login":
					await login(accountId, password);
					break;
			}

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
			{#if isSignupMode && !isLoading}
				<TextField
					value={$_("login.value-will-be-generated")}
					disabled={isSignupMode && !isLoading}
					label={$_("login.account-id")}
					placeholder="b4dcb93bc0c04251a930541e1a3c9a80"
					autocomplete="username"
				/>
			{:else}
				<TextField
					bind:this={accountIdField}
					bind:value={accountId}
					disabled={isSignupMode && !isLoading}
					label={$_("login.account-id")}
					placeholder="b4dcb93bc0c04251a930541e1a3c9a80"
					autocomplete="username"
					showsRequired={false}
					required
					on:input={e => onUpdateAccountId(e.detail)}
				/>
			{/if}
			<TextField
				bind:this={passwordField}
				bind:value={password}
				type="password"
				label={$_(isSignupMode ? "login.new-passphrase" : "login.current-passphrase")}
				placeholder="********"
				autocomplete={isSignupMode ? "new-password" : "current-password"}
				showsRequired={false}
				required
			/>
			{#if isSignupMode}
				<TextField
					bind:value={passwordRepeat}
					type="password"
					label={$_("login.repeat-passphrase")}
					placeholder="********"
					autocomplete="new-password"
					showsRequired={false}
					required={isSignupMode}
				/>
			{/if}
			<ActionButton
				type="submit"
				kind={isSignupMode ? "bordered-primary-green" : "bordered-primary"}
				disabled={isLoading}
				>{$_(isSignupMode ? "login.create-account" : "login.log-in")}</ActionButton
			>

			{#if !$loginProcessState}
				<p>{$_("login.cookie-disclaimer")}</p>
			{/if}
			{#if $loginProcessState === "AUTHENTICATING"}
				<span>{$_("login.process.authenticating")}</span>
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

			{#if !isLoading}
				<div>
					{#if !isSignupEnabled}
						<p>{$_("login.new-account-prompt.open-soon")}.</p>
					{:else if isLoginMode}
						<p
							>{$_("login.new-account-prompt.create.question")}
							<NopLink on:click={enterSignupMode}
								>{$_("login.new-account-prompt.create.action")}</NopLink
							>
						</p>
					{:else if isSignupMode}
						<p
							>{$_("login.new-account-prompt.already-have.question")}
							<NopLink on:click={enterLoginMode}
								>{$_("login.new-account-prompt.already-have.action")}</NopLink
							>
						</p>
					{/if}
				</div>
			{/if}
		</form>
		<Footer />
	</main>
{/if}
