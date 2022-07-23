<script lang="ts">
	import { _ } from "svelte-i18n";
	import { simplifiedByteCount } from "../transformers";
	import { totalSpace, usedSpace } from "../store";

	$: total = $totalSpace !== null ? simplifiedByteCount($totalSpace) : "--";
	$: used = $usedSpace !== null ? simplifiedByteCount($usedSpace) : "--";
</script>

<p class="storage">{$_("common.disk-usage", { values: { used, total } })}</p>

<style lang="scss">
	@use "styles/colors" as *;

	.storage {
		margin: 8pt auto;
		color: color($secondary-label);
	}
</style>
