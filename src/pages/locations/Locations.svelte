<script lang="ts">
	import { allLocations } from "../../store";
	import List from "../../components/List.svelte";
	import LocationListItem from "./LocationListItem.svelte";

	// FIXME: This somehow stays between login sessions
	$: numberOfLocations = $allLocations.length;
</script>

<main class="content">
	<div class="heading">
		<!-- TODO: I18N -->
		<h1>Locations</h1>
		<p>To add a location, set a location on a transaction.</p>
	</div>

	<List>
		{#each $allLocations as location (location.id)}
			<li>
				<LocationListItem {location} />
			</li>
		{/each}
		{#if numberOfLocations > 0}
			<li>
				<p class="footer"
					>{numberOfLocations} file{#if numberOfLocations !== 1}s{/if}
				</p>
			</li>
		{/if}
	</List>
</main>

<style lang="scss">
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
