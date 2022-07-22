<script lang="ts">
	import { isAppTab, appTabs as tabs } from "../model/ui/tabs";
	import { onDestroy, onMount } from "svelte";
	import { useLocation } from "svelte-navigator";
	import TabItem from "./TabItem.svelte";

	const location = useLocation();

	let currentTab: string | undefined = $location.pathname
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
