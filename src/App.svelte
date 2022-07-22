<script lang="ts">
	import type { SvelteToastOptions } from "@zerodevx/svelte-toast";
	import "./i18n";
	import { onMount } from "svelte";
	import { Router } from "./router";
	import { SvelteToast } from "@zerodevx/svelte-toast";
	import { watchColorScheme } from "./store/uiStore";

	const options: SvelteToastOptions = {};

	onMount(watchColorScheme);
</script>

<Router />
<div id="modal" />
<SvelteToast {options} />

<style type="text/scss">
	@use "styles/colors" as *;
	@import "styles/setup";

	:global(#app *) {
		box-sizing: border-box;
	}

	:global(html, body) {
		padding: 0;
		margin: 0;
	}

	:global(main.content) {
		margin: 0;
		padding: 16pt 24pt;
		overflow-y: scroll;
		overflow-x: hidden;
		height: calc(100vh - 44pt);

		.error {
			color: color($red);
		}
	}

	:global(a) {
		color: color($link);
	}

	// Toasts
	:global(.toast-success) {
		--toastBackground: color($alert-success);
		--toastBarBackground: color($green);
	}

	:global(.toast-error) {
		--toastBackground: color($alert-failure);
		--toastBarBackground: color($red);
	}
</style>
