<script setup lang="ts">
import type { LocationPref } from "../../transport";
import ActionButton from "../ActionButton.vue";
import Checkmark from "../../icons/Checkmark.vue";
import { computed, ref, onMounted } from "vue";
import { locationPrefs } from "../../transport";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import { useLocationsStore, useUiStore } from "../../store";

const auth = useAuthStore();
const locations = useLocationsStore();
const ui = useUiStore();
const toast = useToast();

const isLoading = ref(false);
const isLocationApiAvailable = computed(() => locations.isLocationApiAvailable);
const currentSensitivity = computed(() => auth.preferences.locationSensitivity);
const selectedSensitivity = ref<LocationPref>("none");

const sensitivityOptions = computed(() => locationPrefs);

const hasChanges = computed(() => {
	return selectedSensitivity.value !== currentSensitivity.value;
});

function reset() {
	selectedSensitivity.value = currentSensitivity.value;
}

onMounted(() => {
	reset();
});

async function submitNewLocationPref() {
	try {
		if (!locationPrefs.includes(selectedSensitivity.value)) {
			throw new Error(`${selectedSensitivity.value} is not a valid location preference.`);
		}

		isLoading.value = true;

		await auth.updateUserPreferences({
			locationSensitivity: selectedSensitivity.value,
		});
		toast.success("Your preferences have been updated!");
		reset();
	} catch (error: unknown) {
		ui.handleError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form v-if="isLocationApiAvailable" @submit.prevent="submitNewLocationPref">
		<h3>Location Service</h3>
		<p
			>By default, we don't talk to any external location APIs. However, if you want Accountable to
			prefill transaction location fields, you'll need to select a different option below.</p
		>

		<div class="options">
			<ActionButton
				v-for="option in sensitivityOptions"
				:key="option"
				class="option"
				kind="bordered"
				@click.prevent="selectedSensitivity = option"
			>
				<div v-if="option === selectedSensitivity" class="selected">
					<Checkmark />
				</div>
				<div v-else class="not-selected" />

				<div class="option-details">
					<span v-if="option === 'none'">None</span>
					<span v-else-if="option === 'vague'">Imprecise</span>
					<span v-else-if="option === 'specific'">Precise</span>

					<p v-if="option === 'none'">No location services.</p>
					<p v-else-if="option === 'vague'">Get, on-demand, a locale based on your IP address.</p>
					<p v-else-if="option === 'specific'">Get the best-available location information.</p>
				</div>
			</ActionButton>
		</div>
		<div v-if="false && selectedSensitivity !== 'none'">
			<p
				>Requests go to <code>https://api.freegeoip.app/json/?apikey=XXXXXXXXXXXXXX</code>.
				Responses are generated from your IP address, and return a locale based on their database of
				IP addresses and locales.</p
			>
		</div>
		<p style="font-size: small"
			>Note that we have no "automatic" location features. We only fetch your current location when
			you press a button to request it. We use the
			<a href="https://freegeoip.app" target="__blank">FreeGeoIp</a> API to obtain vague location
			data.</p
		>

		<div class="buttons">
			<ActionButton type="submit" kind="bordered-primary" :disabled="!hasChanges || isLoading"
				>Confirm preference</ActionButton
			>
			<ActionButton v-show="hasChanges" kind="bordered" :disabled="isLoading" @click.prevent="reset"
				>Reset</ActionButton
			>
		</div>
	</form>
	<form v-else @submit.prevent>
		<h3>Location Service</h3>
		<p
			>To enable location services, add a
			<a href="https://freegeoip.app" target="__blank">FreeGeoIp</a> API key to
			<code>VITE_FREEGEOIP_API_KEY</code> in your .env file.</p
		>
	</form>
</template>

<style scoped lang="scss">
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
