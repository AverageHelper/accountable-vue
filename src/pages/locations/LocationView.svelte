<script lang="ts">
	import type { Location } from "../../model/Location";

	export let location: Location;
</script>

<p>ID: {location.id}</p>
<p>Title: {location.title}</p>
<p>Subtitle: {location.subtitle}</p>
<p>Last Used: {location.lastUsed}</p>
{#if location.coordinate}
	<p>Lat: {location.coordinate.lat}</p>
	<p>Lng: {location.coordinate.lng}</p>
{/if}
