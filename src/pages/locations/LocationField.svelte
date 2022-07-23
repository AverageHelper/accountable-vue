<script lang="ts">
	import type { Coordinate, Location, LocationRecordParams } from "../../model/Location";
	import type { IPLocateResult } from "../../transport";
	import { allLocations, handleError, locations, preferences } from "../../store";
	import { createEventDispatcher } from "svelte";
	import { fetchLocationData } from "../../transport";
	import { Link } from "svelte-navigator";
	import { location as newLocation } from "../../model/Location";
	import { settingsPath } from "../../router";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Fuse from "fuse.js";
	import List from "../../components/List.svelte";
	import LocationIcon from "../../icons/Location.svelte";
	import LocationListItem from "./LocationListItem.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	/**
	 * Cases:
	 * - No location (empty text field)
	 * - Location selected (text in field, with an icon, creates an entry if doesn't exist already, updates transaction)
	 * - Modifying selection (text in field, with a different icon)
	 * - Choosing a recent location (hopping through the dropdown)
	 *
	 * Actions:
	 * - Set text as a location
	 * - Set current location as a location
	 * - Set a nearby location as a location
	 * - Clear location
	 */

	const dispatch = createEventDispatcher<{
		change: (LocationRecordParams & { id: string | null }) | null;
	}>();

	export let value: (LocationRecordParams & { id: string | null }) | null = null;

	let titleField: TextField | undefined;
	let recentsList: List | undefined;
	let hasFocus = false;

	$: locationPreference = $preferences.locationSensitivity;
	$: mayGetLocation = locationPreference !== "none";

	$: searchClient = new Fuse($allLocations, { keys: ["title", "subtitle"] });
	$: shouldSearch = selectedLocationId === null && newLocationTitle !== "";

	$: recentLocations = shouldSearch
		? searchClient.search(newLocationTitle).map(r => r.item)
		: $allLocations;

	let newLocationTitle = "";
	let newLocationSubtitle = "";
	let newLocationCoordinates: Coordinate | null = null;

	$: textLocationPreview = newLocation({
		id: "sample",
		title: `"${newLocationTitle}"`, // TODO: I18N (quotes)
		subtitle: null,
		coordinate: null,
		lastUsed: new Date(),
	});

	let selectedLocationId: string | null = null;
	$: selectedLocation = selectedLocationId !== null ? $locations[selectedLocationId] ?? null : null;

	$: title = selectedLocation?.title ?? newLocationTitle;
	$: subtitle = selectedLocation?.subtitle ?? newLocationSubtitle;
	$: coordinate = selectedLocation?.coordinate ?? newLocationCoordinates ?? null;

	const settingsRoute = settingsPath();

	async function updateFocusState() {
		// Wait until new focus is resolved before we check again
		await new Promise(resolve => setTimeout(resolve, 30));
		hasFocus =
			(titleField?.contains(document.activeElement) ?? false) ||
			(recentsList?.contains(document.activeElement) ?? false);
	}

	$: selectedLocationId = value?.id ?? null;

	function onLocationSelect(location: Location, event?: KeyboardEvent) {
		// if event is given, make sure space or enter key
		if (event && event.code !== "Enter" && event.code !== "Space") return;

		// Fill fields with this location's details
		selectedLocationId = location.id;
		newLocationTitle = location.title;
		newLocationSubtitle = location.subtitle ?? "";
		newLocationCoordinates = location.coordinate !== null ? { ...location.coordinate } : null;
		updateModelValue();

		// Hide the recents list for now, since we just got this entry from there
		hasFocus = false;
	}

	async function getLocation(event: Event) {
		event.preventDefault();
		if (!mayGetLocation) return;

		// We don't yet differentiate between "vague" and "specific" granularity.
		// Just get what info the user's IP address will tell us. (Might be real accurate if IPv6, not sure)
		let data: IPLocateResult;
		try {
			data = await fetchLocationData();
		} catch (error) {
			// CORS errors, and possibly others, throw an empty string. Not sure why.
			handleError(((error as null | undefined) ?? "") || "Something went wrong, not sure what.");
			return;
		}

		const { city, country, latitude: lat, longitude: lng } = data;

		newLocationTitle = city ?? "Unknown";
		newLocationSubtitle = country ?? "";
		newLocationCoordinates = lat === null || lng === null ? null : { lat, lng };
		updateModelValue();
	}

	function clear(event: Event) {
		event.preventDefault();
		newLocationTitle = "";
		newLocationSubtitle = "";
		newLocationCoordinates = null;
		dispatch("change", null);
	}

	function updateModelValue() {
		const record: LocationRecordParams & { id: string | null } = {
			id: null,
			title,
			subtitle,
			coordinate,
			lastUsed: new Date(),
		};
		dispatch("change", record);
	}

	function updateTitle({ detail: title }: CustomEvent<string>) {
		newLocationTitle = title;
		updateModelValue();
	}

	function updateSubtitle({ detail: subtitle }: CustomEvent<string>) {
		newLocationSubtitle = subtitle;
		updateModelValue();
	}
</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label on:focusin={updateFocusState} on:focusout={updateFocusState}>
	<div class="container-d1881526">
		<div class="fields">
			<!-- TODO: I18N -->
			<TextField
				bind:this={titleField}
				value={title}
				class="title-field"
				label={title ? "location title" : "location"}
				placeholder="ACME Co."
				on:input={updateTitle}
			/>
			{#if !!title || !!subtitle}
				<TextField
					value={subtitle}
					class="title-field"
					label="location subtitle"
					placeholder="Swahilli, New Guinnea"
					on:input={updateSubtitle}
				/>
			{/if}
		</div>

		{#if hasFocus}
			<List bind:this={recentsList} class="recent-location-select">
				{#if newLocationTitle}
					<li tabindex="0">
						<LocationListItem location={textLocationPreview} />
					</li>
				{/if}
				{#if recentLocations.length > 0}
					<li tabindex="-1">
						<strong>Recent Locations</strong>
					</li>
				{/if}
				{#each recentLocations as location (location.id)}
					<li
						tabindex="0"
						on:keydown|stopPropagation|preventDefault={e => onLocationSelect(location, e)}
						on:click|stopPropagation|preventDefault={() => onLocationSelect(location)}
					>
						<LocationListItem {location} />
					</li>
				{/each}
			</List>
		{/if}

		{#if !!selectedLocationId || !!title || !!subtitle || !!coordinate}
			<ActionButton
				class="clear"
				kind="bordered-destructive"
				title="Clear location"
				on:click={clear}
			>
				<span>X</span>
			</ActionButton>
		{/if}
		{#if mayGetLocation && !selectedLocationId && !title}
			<ActionButton
				class="current-location"
				kind="bordered"
				title="Get current location"
				on:click={getLocation}
			>
				<LocationIcon />
			</ActionButton>
		{/if}
	</div>

	{#if !mayGetLocation}
		<p class="disclaimer" on:click|stopPropagation|preventDefault
			>To get your current location, you'll need to enable the location service in
			<Link to={settingsRoute}>Settings</Link>.</p
		>
	{/if}
</label>

<style lang="scss" global>
	@use "styles/colors" as *;

	.container-d1881526 {
		position: relative;
		display: flex;
		flex-flow: row nowrap;

		> .fields {
			display: flex;
			flex-flow: column nowrap;
			width: 100%;
		}

		.title-field {
			width: 100%;
		}

		.recent-location-select {
			position: absolute;
			top: 4.4em;
			left: 0;
			z-index: 100;
			width: calc(100% - 44pt - 8pt);
			border-radius: 0 0 4pt 4pt;
			background-color: color($secondary-fill);

			> li {
				background-color: color($clear);
				padding: 4pt;

				.icon {
					margin-right: 4pt;
				}

				&:focus {
					background-color: color($fill);

					> .location {
						background-color: color($fill);
					}
				}
			}
		}

		.current-location,
		.clear {
			margin: 0 0 8pt 8pt;
			margin-top: 1.8em;
			height: 100%;
		}
	}

	.disclaimer {
		font-size: small;
		margin-top: 0;
		padding-top: 0;
	}
</style>
