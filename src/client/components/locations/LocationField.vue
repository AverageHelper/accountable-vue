<script setup lang="ts">
import type { Coordinate, Location, LocationRecordParams } from "../../model/Location";
import type { IPLocateResult } from "../../transport";
import type { PropType } from "vue";
import ActionButton from "../ActionButton.vue";
import List from "../List.vue";
import LocationIcon from "../../icons/Location.vue";
import LocationListItem from "./LocationListItem.vue";
import TextField from "../TextField.vue";
import { computed, ref, toRefs, watch } from "vue";
import { fetchLocationData } from "../../transport";
import { useAuthStore, useLocationsStore, useUiStore } from "../../store";

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

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	modelValue: {
		type: Object as PropType<(LocationRecordParams & { id: string | null }) | null>,
		default: null,
	},
});
const { modelValue } = toRefs(props);

const auth = useAuthStore();
const locations = useLocationsStore();
const ui = useUiStore();

const root = ref<HTMLLabelElement | null>(null);
const hasFocus = ref(false);

const locationPreference = computed(() => auth.preferences.locationSensitivity);
const mayGetLocation = computed(() => locationPreference.value !== "none");
const allLocations = computed(() => locations.allLocations);

const newLocationTitle = ref("");
const newLocationSubtitle = ref("");
const newLocationCoordinates = ref<Coordinate | null>(null);

const selectedLocationId = ref<string | null>(null);
const selectedLocation = computed<Location | null>(() =>
	selectedLocationId.value !== null ? locations.items[selectedLocationId.value] ?? null : null
);

const title = computed(() => selectedLocation.value?.title ?? newLocationTitle.value);
const subtitle = computed(() => selectedLocation.value?.subtitle ?? newLocationSubtitle.value);
const coordinates = computed(
	() => selectedLocation.value?.coordinate ?? newLocationCoordinates.value ?? null
);

const hasChanged = computed(() => {
	return false;
});

async function updateFocusState() {
	// Wait until new focus is resolved before we check again
	await new Promise(resolve => setTimeout(resolve, 30));
	hasFocus.value = root.value?.contains(document.activeElement) ?? false;
}

watch(
	modelValue,
	modelValue => {
		selectedLocationId.value = modelValue?.id ?? null;
	},
	{ immediate: true }
);

function onLocationSelect(location: Location) {
	selectedLocationId.value = location.id;
	root.value?.focus();
}

async function getLocation() {
	if (!mayGetLocation.value) return;

	// We don't yet differentiate between "vague" and "specific" granularity.
	// Just get what info the user's IP address will tell us. (Might be real accurate if IPv6, not sure)
	let data: IPLocateResult;
	try {
		data = await fetchLocationData();
	} catch (error: unknown) {
		// CORS errors, and possibly others, throw an empty string. Not sure why.
		ui.handleError(((error as null | undefined) ?? "") || "Something went wrong, not sure what.");
		return;
	}

	const { city, country, latitude: lat, longitude: lng } = data;

	newLocationTitle.value = city ?? "Unknown";
	newLocationSubtitle.value = country ?? "";
	newLocationCoordinates.value = lat === null || lng === null ? null : { lat, lng };
	updateModelValue();
}

function clear() {
	newLocationTitle.value = "";
	newLocationSubtitle.value = "";
	newLocationCoordinates.value = null;
	emit("update:modelValue", null);
}

function updateModelValue() {
	const record: LocationRecordParams & { id: string | null } = {
		id: null,
		title: title.value,
		subtitle: subtitle.value,
		coordinate: coordinates.value,
		lastUsed: new Date(),
	};
	emit("update:modelValue", record);
}

function updateTitle(title: string) {
	newLocationTitle.value = title;
	updateModelValue();
}

function updateSubtitle(subtitle: string) {
	newLocationSubtitle.value = subtitle;
	updateModelValue();
}
</script>

<template>
	<label ref="root" @focusin="updateFocusState" @focusout="updateFocusState">
		<div class="container">
			<div class="fields">
				<TextField
					:model-value="title"
					class="title-field"
					:label="title ? 'location title' : 'location'"
					placeholder="ACME Co."
					@update:modelValue="updateTitle"
				/>
				<TextField
					v-show="!!title"
					:model-value="subtitle"
					class="title-field"
					label="location subtitle"
					placeholder="Swahilli, New Guinnea"
					@update:modelValue="updateSubtitle"
				/>
			</div>

			<ActionButton
				v-if="
					!!modelValue || !!newLocationTitle || !!newLocationSubtitle || !!newLocationCoordinates
				"
				class="clear"
				kind="bordered-destructive"
				title="Clear location"
				@click.prevent="clear"
			>
				<span>X</span>
			</ActionButton>
			<ActionButton
				v-if="mayGetLocation && !hasChanged && !modelValue && !newLocationTitle"
				class="current-location"
				kind="bordered"
				title="Get current location"
				@click.prevent="getLocation"
			>
				<LocationIcon />
			</ActionButton>

			<List v-show="hasFocus && allLocations.length > 0" class="recent-location-select">
				<li>
					<strong>Recent Locations</strong>
				</li>
				<li
					v-for="location in allLocations"
					:key="location.id"
					tabindex="0"
					@keydown.space="onLocationSelect(location)"
					@enter="onLocationSelect(location)"
					@click="onLocationSelect(location)"
				>
					<LocationListItem :location="location" />
				</li>
			</List>
		</div>

		<p v-if="!mayGetLocation" class="disclaimer"
			>To get your current location, you'll need to enable the location service in
			<router-link to="/settings">Settings</router-link>.</p
		>
	</label>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.container {
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
		background-color: color($secondary-fill);
		border-radius: 4pt;

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
