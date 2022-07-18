<script lang="ts">
	import TabItem from "./TabItem.svelte";
	import { isAppTab, appTabs as tabs } from "../model/ui/tabs";
	import { onDestroy, onMount } from "svelte";
	import { useRoute } from "vue-router";

	const route = useRoute();

	let currentTab: string | undefined = route.path
		.split("/") // split path by delimiters
		.find(s => s !== ""); // get first nonempty path segment

	if (!isAppTab(currentTab)) currentTab = null;

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
	<nav class={$$props.class}>
		{#each tabs as tab}
			<TabItem class="item" {tab} is-selected={currentTab === tab} />
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
