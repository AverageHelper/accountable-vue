<script lang="ts">
	import ActionButton from "./ActionButton.svelte";
</script>

<ActionButton class="tiny {$$props['class']}">
	<slot />
</ActionButton>

<style type="text/scss">
	@use "styles/colors" as *;

	.tiny {
		min-height: 12pt;
		min-width: 12pt;
		font-size: small;
		text-align: center;

		@media (hover: hover) {
			&:hover {
				background-color: color($transparent-gray);
			}
		}
	}
</style>
