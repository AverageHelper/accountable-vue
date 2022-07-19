<script lang="ts">
	import { onMount } from "svelte";
	import { useUiStore } from "./store/uiStore";
	import Navbar from "./components/Navbar.svelte";

	const ui = useUiStore();

	onMount(() => {
		ui.watchColorScheme();
	});
</script>

<Navbar />
<keep-alive>
	<router-view />
</keep-alive>
<div id="modal" />

<style type="text/scss">
	@use "styles/colors" as *;
	@import "styles/setup";

	#app * {
		box-sizing: border-box;
	}

	html,
	body {
		padding: 0;
		margin: 0;
	}

	main.content {
		margin: 0;
		padding: 16pt 24pt;
		overflow-y: scroll;
		overflow-x: hidden;
		height: calc(100vh - 44pt);

		.error {
			color: color($red);
		}
	}

	a {
		color: color($link);
	}
</style>
