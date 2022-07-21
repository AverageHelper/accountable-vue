<script lang="ts">
	import type { CurrentRoute } from "svelte-router-spa/types/components/route";
	import { isAppTab, appTabs as tabs } from "../model/ui/tabs";
	import { onDestroy, onMount } from "svelte";
	import TabItem from "./TabItem.svelte";

	export let currentRoute: CurrentRoute;

	let currentTab: string | undefined = currentRoute.path
		.split("/") // split path by delimiters
		.find(s => s !== ""); // get first nonempty path segment

	if (!isAppTab(currentTab)) currentTab = undefined;

	let windowWidth = window.innerWidth;
	$: tooSmall = windowWidth < 768;

	function onResize() {
		windowWidth = window.innerWidth;
	}

	onMount(() => {
		window.addEventListener("resize", onResize);
	});

	onDestroy(() => {
		window.removeEventListener("resize", onResize);
	});
</script>

{#if !tooSmall}
	<nav class={$$props["class"]}>
		{#each tabs as tab}
			<TabItem class="item" {tab} isSelected={currentTab === tab} />
		{/each}
	</nav>
{/if}

<style type="text/scss">
	@use "styles/colors" as *;

	nav {
		background-color: color($navbar-background);
		display: flex;
		flex-flow: row nowrap;
		justify-content: center;
		align-items: center;
		overflow-y: scroll;
	}
</style>
