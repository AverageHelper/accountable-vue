<script lang="ts">
	import { _ } from "svelte-i18n";
	import { handleError } from "../../store";
	import { toast } from "@zerodevx/svelte-toast";
	import { useAuthStore } from "../../store/authStore";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import NewLoginModal from "../../components/NewLoginModal.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const auth = useAuthStore();

	let isLoading = false;
	$: currentAccountId = auth.accountId;
	let currentPassword = "";

	$: hasChanges = currentPassword !== "";

	function reset(event?: Event) {
		event?.preventDefault();
		currentPassword = "";
	}

	async function regenerateAccountId() {
		try {
			if (!currentPassword) {
				throw new Error($_("error.form.missing-required-fields"));
			}

			isLoading = true;

			await auth.regenerateAccountId(currentPassword);
			toast.push("Your account ID has been updated!", { classes: ["toast-success"] }); // TODO: I18N
			reset();
		} catch (error) {
			handleError(error);
		}
		isLoading = false;
	}
</script>

<form on:submit|preventDefault={regenerateAccountId}>
	<!-- TODO: I18N -->
	<h3>Change Account ID</h3>
	<p>Somebody bothering you with your account ID? You can change it with one click:</p>
	<TextField
		value={currentAccountId ?? "b4dcb93bc0c04251a930541e1a3c9a80"}
		type="text"
		label="current account ID"
		disabled
	/>
	<TextField
		value={currentPassword}
		on:input={e => (currentPassword = e.detail)}
		type="password"
		label="current passphrase"
		placeholder="********"
		autocomplete="current-password"
		showsRequired={false}
		required
	/>
	<div class="buttons">
		<ActionButton type="submit" kind="bordered-primary" disabled={!hasChanges || isLoading}
			>Regenerate account ID</ActionButton
		>
		{#if hasChanges}
			<ActionButton kind="bordered" disabled={isLoading} on:click={reset}>Reset</ActionButton>
		{/if}
	</div>
</form>

<NewLoginModal />

<style type="text/scss">
	.buttons {
		display: flex;
		flex-flow: row nowrap;

		:not(:last-child) {
			margin-right: 8pt;
		}
	}
</style>
