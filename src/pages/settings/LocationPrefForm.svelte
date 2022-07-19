<script lang="ts">
	import type { LocationPref } from "../../transport";
	import { handleError } from "../../store";
	import { locationPrefs as sensitivityOptions } from "../../transport";
	import { onMount } from "svelte";
	import { toast } from "@zerodevx/svelte-toast";
	import { useAuthStore } from "../../store/authStore";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Checkmark from "../../icons/Checkmark.svelte";
	import OutLink from "../../components/OutLink.svelte";

	const auth = useAuthStore();

	let isLoading = false;
	$: currentSensitivity = auth.preferences.locationSensitivity;
	let selectedSensitivity: LocationPref = "none";

	$: hasChanges = selectedSensitivity !== currentSensitivity;

	function reset(event?: Event) {
		event?.preventDefault();
		selectedSensitivity = currentSensitivity;
	}

	onMount(() => {
		reset();
	});

	// For some reason, we keep resetting `selectedSensitivity` to "none" when the preference changes.
	// This should fix that.
	$: currentSensitivity && reset();

	async function submitNewLocationPref() {
		try {
			if (!sensitivityOptions.includes(selectedSensitivity)) {
				// TODO: I18N
				throw new Error(`${selectedSensitivity} is not a valid location preference.`);
			}

			isLoading = true;

			await auth.updateUserPreferences({
				locationSensitivity: selectedSensitivity,
			});
			toast.push("Your preferences have been updated!", { classes: ["toast-success"] }); // TODO: I18N
			reset();
		} catch (error) {
			handleError(error);
		}
		isLoading = false;
	}
</script>

<form on:submit|preventDefault={submitNewLocationPref}>
	<!-- TODO: I18N -->
	<h3>Location Service</h3>
	<p
		>By default, we don't talk to any external location APIs. However, if you want Accountable to
		prefill transaction location fields, you'll need to select a different option below.</p
	>

	<div class="options">
		{#each sensitivityOptions as option}
			<ActionButton
				class="option"
				kind="bordered"
				on:click={e => {
					e.preventDefault();
					selectedSensitivity = option;
				}}
			>
				{#if option === selectedSensitivity}
					<div class="selected">
						<Checkmark />
					</div>
				{:else}
					<div class="not-selected" />
				{/if}

				<div class="option-details">
					{#if option === "none"}
						<span>None</span>
					{:else if option === "vague"}
						<span>Imprecise</span>
					{:else if option === "specific"}
						<span>Precise</span>
					{/if}

					{#if option === "none"}
						<p>No location services.</p>
					{:else if option === "vague"}
						<p>Get, on-demand, a locale based on your IP address.</p>
					{:else if option === "specific"}
						<p>Get the best-available location information.</p>
					{/if}
				</div>
			</ActionButton>
		{/each}
	</div>
	<p style="font-size: small"
		>Note that we have no "automatic" location features. We only fetch your current location when
		you press a button to request it. We use the
		<OutLink to="https://www.iplocate.io">IPLocate</OutLink> API to obtain vague location data.</p
	>

	<div class="buttons">
		<ActionButton type="submit" kind="bordered-primary" disabled={!hasChanges || isLoading}
			>Confirm preference</ActionButton
		>
		{#if hasChanges}
			<ActionButton kind="bordered" disabled={isLoading} on:click={reset}>Reset</ActionButton>
		{/if}
	</div>
</form>

<style type="text/scss">
	@use "styles/colors" as *;

	.options {
		.option {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			width: 100%;
			margin: 0;

			&:not(:last-child) {
				margin-bottom: 8pt;
			}

			&-details {
				display: flex;
				flex-flow: column nowrap;
				justify-content: flex-start;
				text-align: left;

				> span {
					margin-top: 8pt;
				}

				> p {
					margin: 4pt 8pt;
					margin-bottom: 8pt;
					color: color($secondary-label);
				}
			}

			.selected {
				min-width: 22pt;
				width: 22pt;
				height: 22pt;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.not-selected {
				min-width: 22pt;
				width: 22pt;
				height: 22pt;
				border-radius: 50%;
				border: 2pt solid color($gray);
			}

			span {
				margin-left: 8pt;
			}
		}
	}

	.buttons {
		display: flex;
		flex-flow: row nowrap;

		:not(:last-child) {
			margin-right: 8pt;
		}
	}
</style>
