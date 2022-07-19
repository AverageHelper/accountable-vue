<script lang="ts">
	import type { Location } from "../../model/Location";

	export let location: Location;
</script>

<p>{location.title}</p>
<p>{location.subtitle}</p>
<p>{location.lastUsed}</p>
<p>{location.coordinate}</p>
