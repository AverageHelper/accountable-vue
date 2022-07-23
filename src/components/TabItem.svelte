<script lang="ts">
	import type { Tab } from "../model/ui/tabs";
	import { _ } from "svelte-i18n";
	import { labelIdForTab, routeForTab } from "../model/ui/tabs";

	export let tab: Tab;
	export let isSelected: boolean = false;

	$: href = routeForTab(tab);
	$: labelId = labelIdForTab(tab);
</script>

<a class="item-container {isSelected ? 'selected' : ''} {$$props['class']}" {href}>{$_(labelId)}</a>

<style lang="scss">
	@use "styles/colors" as *;

	.item-container {
		display: flex;
		align-items: center;
		min-height: 3em;
		height: 100%;
		padding: 0 1em;
		font-weight: bold;
		text-decoration: none;

		&.selected {
			border-bottom: 2pt solid color($link);
		}

		@media (hover: hover) {
			&:hover {
				background: color($gray4);
				text-decoration: none;
			}
		}
	}
</style>
