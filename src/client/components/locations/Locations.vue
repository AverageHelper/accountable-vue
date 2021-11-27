<script setup lang="ts">
import List from "../List.vue";
import LocationListItem from "./LocationListItem.vue";
import { useLocationsStore } from "../../store";
import { computed } from "vue";

const locations = useLocationsStore();

const allLocations = computed(() => locations.allLocations);
const numberOfLocations = computed(() => allLocations.value.length);
</script>

<template>
	<div class="heading">
		<h1>Locations</h1>
		<p>To add a location, set a location on a transaction.</p>
	</div>

	<List>
		<li v-for="location in allLocations" :key="location.id">
			<LocationListItem :location="location" />
		</li>
		<li v-if="numberOfLocations > 0">
			<p class="footer"
				>{{ numberOfLocations }} file<span v-if="numberOfLocations !== 1">s</span></p
			>
		</li>
	</List>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.heading {
	max-width: 36em;
	margin: 1em auto;

	> h1 {
		margin: 0;
	}
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
