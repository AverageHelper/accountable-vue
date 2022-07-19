<script lang="ts">
	import type { Location } from "../../model/Location";
	import LocationIcon from "../../icons/Location.svelte";
	import TextIcon from "../../icons/Text.svelte";

	export let location: Location;
</script>

<div class="location">
	{#if location.coordinate}
		<LocationIcon />
	{:else}
		<TextIcon />
	{/if}
	<span>{location.title}</span>
</div>

<style type="text/scss">
	@use "styles/colors" as *;

	.location {
		background-color: color($secondary-fill);
		padding: 4pt;
		cursor: pointer;

		@media (hover: hover) {
			&:hover {
				background-color: color($fill);
			}
		}

		.icon {
			margin-right: 4pt;
		}
	}
</style>
