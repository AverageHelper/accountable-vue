<script lang="ts">
	import { _ } from "svelte-i18n";
	import { accountsPath, loginPath, signupPath } from "../../router";
	import { onMount } from "svelte";
	import { useRoute, useRouter } from "vue-router";
	import { useAuthStore } from "../../store/authStore";
	import { useUiStore } from "../../store";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import ErrorNotice from "../../components/ErrorNotice.svelte";
	import Footer from "../../Footer.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const auth = useAuthStore();
	const ui = useUiStore();
	const router = useRouter();
	const route = useRoute();

	const isSignupEnabled = auth.isSignupEnabled;

	$: isLoggedIn = auth.uid !== null;
	$: bootstrapError = ui.bootstrapError;
	let accountId = "";
	let password = "";
	let passwordRepeat = "";
	let isLoading = false;
	$: mode = !isSignupEnabled
		? "login" // can't sign up? log in instead.
		: route.path === signupPath()
		? "signup"
		: "login";
	$: isSignupMode = mode === "signup";
	$: isLoginMode = mode === "login";
	$: loginProcessState = auth.loginProcessState;

	let accountIdField: TextField | undefined;
	let passwordField: TextField | undefined;

	onMount(() => {
		accountIdField?.focus();
		ui.bootstrap();
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
		void router.push(accountsPath());
	} else if (route.path !== loginPath() && route.path !== signupPath()) {
		switch (mode) {
			case "login":
				void router.push(loginPath());
				break;
			case "signup":
				void router.push(signupPath());
				break;
		}
	}

	function enterSignupMode() {
		accountId = "";
		void router.replace(signupPath());
	}

	function enterLoginMode() {
		accountId = "";
		void router.replace(loginPath());
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
				accountId = auth.createAccountId();
			}

			if (!accountId || !password || (isSignupMode && !passwordRepeat))
				throw new Error($_("error.form.missing-required-fields"));
			if (isSignupMode && password !== passwordRepeat)
				throw new Error($_("error.form.password-mismatch"));

			switch (mode) {
				case "signup":
					await auth.createVault(accountId, password);
					break;

				case "login":
					await auth.login(accountId, password);
					break;
			}

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
					shows-required={false}
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
				shows-required={false}
				required
			/>
			{#if isSignupMode}
				<TextField
					bind:value={passwordRepeat}
					type="password"
					label={$_("login.repeat-passphrase")}
					placeholder="********"
					autocomplete="new-password"
					shows-required={false}
					required={isSignupMode}
				/>
			{/if}
			<ActionButton
				type="submit"
				kind={isSignupMode ? "bordered-primary-green" : "bordered-primary"}
				disabled={isLoading}
				>{$_(isSignupMode ? "login.create-account" : "login.log-in")}</ActionButton
			>

			{#if !loginProcessState}
				<p>{$_("login.cookie-disclaimer")}</p>
			{/if}
			{#if loginProcessState === "AUTHENTICATING"}
				<span>{$_("login.process.authenticating")}</span>
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

			{#if !isLoading}
				<div>
					{#if !isSignupEnabled}
						<p>{$_("login.new-account-prompt.open-soon")}.</p>
					{:else if isLoginMode}
						<p
							>{$_("login.new-account-prompt.create.question")}
							<a href="#" on:click|preventDefault={enterSignupMode}
								>{$_("login.new-account-prompt.create.action")}</a
							>
						</p>
					{:else if isSignupMode}
						<p
							>{$_("login.new-account-prompt.already-have.question")}
							<a href="#" on:click|preventDefault={enterLoginMode}
								>{$_("login.new-account-prompt.already-have.action")}</a
							>
						</p>
					{/if}
				</div>
			{/if}
		</form>
		<Footer />
	</main>
{/if}
