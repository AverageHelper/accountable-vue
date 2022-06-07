<script setup lang="ts">
import type { LocationPref } from "../../transport";
import ActionButton from "../../components/buttons/ActionButton.vue";
import Checkmark from "../../icons/Checkmark.vue";
import OutLink from "../../components/OutLink.vue";
import { computed, ref, onMounted, watch } from "vue";
import { locationPrefs } from "../../transport";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import { useUiStore } from "../../store";

const auth = useAuthStore();
const ui = useUiStore();
const toast = useToast();

const isLoading = ref(false);
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

watch(currentSensitivity, () => {
	// For some reason, we keep resetting `selectedSensitivity` to "none" when the preference changes.
	// This should fix that.
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
	} catch (error) {
		ui.handleError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submitNewLocationPref">
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
				<div v-else class="not-selected"></div>

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
		<p style="font-size: small"
			>Note that we have no "automatic" location features. We only fetch your current location when
			you press a button to request it. We use the
			<OutLink to="https://www.iplocate.io">IPLocate</OutLink> API to obtain vague location data.</p
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
