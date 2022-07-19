<script lang="ts">
	import { _ } from "svelte-i18n";
	import { handleError } from "../../store";
	import { toast } from "@zerodevx/svelte-toast";
	import { useAuthStore } from "../../store/authStore";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const auth = useAuthStore();

	let isLoading = false;
	let currentPassword = "";
	let newPassword = "";
	let newPasswordRepeat = "";

	$: hasChanges = currentPassword !== "" && newPassword !== "" && newPassword === newPasswordRepeat;

	function reset(event?: Event) {
		event?.preventDefault();
		currentPassword = "";
		newPassword = "";
		newPasswordRepeat = "";
	}

	async function submitNewPassword() {
		try {
			if (!currentPassword || !newPassword || !newPasswordRepeat) {
				throw new Error($_("error.form.missing-required-fields"));
			}
			if (newPassword !== newPasswordRepeat) {
				throw new Error($_("error.form.password-mismatch"));
			}

			isLoading = true;

			await auth.updatePassword(currentPassword, newPassword);
			toast.push("Your passphrase has been updated!", { classes: ["toast-success"] }); // TODO: I18N
			reset();
		} catch (error) {
			handleError(error);
		}
		isLoading = false;
	}
</script>

<form on:submit|preventDefault={submitNewPassword}>
	<!-- TODO: I18N -->
	<h3>Change Passphrase</h3>
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
	<TextField
		value={newPassword}
		on:input={e => (newPassword = e.detail)}
		type="password"
		label="new passphrase"
		placeholder="************"
		autocomplete="new-password"
		showsRequired={false}
		required
	/>
	<TextField
		value={newPasswordRepeat}
		on:input={e => (newPasswordRepeat = e.detail)}
		type="password"
		label="new passphrase again"
		placeholder="************"
		autocomplete="new-password"
		showsRequired={false}
		required
	/>
	<div class="buttons">
		<ActionButton type="submit" kind="bordered-primary" disabled={!hasChanges || isLoading}
			>Change passphrase</ActionButton
		>
		{#if hasChanges}
			<ActionButton kind="bordered" disabled={isLoading} on:click={reset}>Reset</ActionButton>
		{/if}
	</div>
</form>

<style type="text/scss">
	.buttons {
		display: flex;
		flex-flow: row nowrap;

		:not(:last-child) {
			margin-right: 8pt;
		}
	}
</style>
