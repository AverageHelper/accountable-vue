<script lang="ts">
	import { _ } from "svelte-i18n";
	import { accountsPath, loginPath, signupPath } from "../../router";
	import { onMount } from "svelte";
	import { useLocation, useNavigate } from "svelte-navigator";
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

	const location = useLocation();
	const navigate = useNavigate();

	let accountId = "";
	let password = "";
	let passwordRepeat = "";
	let isLoading = false;

	$: isLoggedIn = $uid !== null;
	$: mode = !isSignupEnabled
		? "login" // can't sign up? log in instead.
		: $location.pathname === signupPath()
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
		navigate(accountsPath());
	} else if ($location.pathname !== loginPath() && $location.pathname !== signupPath()) {
		switch (mode) {
			case "login":
				navigate(loginPath());
				break;
			case "signup":
				navigate(signupPath());
				break;
		}
	}

	function enterSignupMode() {
		accountId = "";
		navigate(signupPath(), { replace: true });
	}

	function enterLoginMode() {
		accountId = "";
		navigate(loginPath(), { replace: true });
	}

	function onUpdateAccountId(event: CustomEvent<string>) {
		const newId = event.detail;
		if (!isSignupMode || isLoading) {
			accountId = newId;
		} else {
			accountId = accountId;
		}
	}

	function onUpdatePassphrase(event: CustomEvent<string>) {
		const newPassphrase = event.detail;
		password = newPassphrase;
	}

	function onUpdateRepeatPassphrase(event: CustomEvent<string>) {
		const newPassphrase = event.detail;
		passwordRepeat = newPassphrase;
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

			navigate(accountsPath(), { replace: true });
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
					value={accountId}
					on:input={onUpdateAccountId}
					disabled={isSignupMode && !isLoading}
					label={$_("login.account-id")}
					placeholder="b4dcb93bc0c04251a930541e1a3c9a80"
					autocomplete="username"
					showsRequired={false}
					required
				/>
			{/if}
			<TextField
				bind:this={passwordField}
				value={password}
				on:input={onUpdatePassphrase}
				type="password"
				label={$_(isSignupMode ? "login.new-passphrase" : "login.current-passphrase")}
				placeholder="********"
				autocomplete={isSignupMode ? "new-password" : "current-password"}
				showsRequired={false}
				required
			/>
			{#if isSignupMode}
				<TextField
					value={passwordRepeat}
					on:input={onUpdateRepeatPassphrase}
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
