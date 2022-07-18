<script lang="ts">
	import type { Tab } from "../model/ui/tabs";
	import { _ } from "svelte-i18n";
	import { labelIdForTab, routeForTab } from "../model/ui/tabs";

	export let tab: Tab;
	export let isSelected: boolean = false;

	$: to = routeForTab(tab);
	$: labelId = labelIdForTab(tab);
</script>

<router-link class="item-container {isSelected ? 'selected' : ''} {$$props.class}" {to}
	>{$_(labelId)}</router-link
>

<style type="text/scss">
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
