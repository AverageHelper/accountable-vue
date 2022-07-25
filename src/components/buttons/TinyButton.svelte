<script lang="ts">
	import ActionButton from "./ActionButton.svelte";
</script>

<ActionButton class="tiny-button-250d758a {$$props['class']}">
	<slot />
</ActionButton>

<style lang="scss" global>
	@use "styles/colors" as *;

	button.tiny-button-250d758a {
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
