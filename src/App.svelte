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

<style lang="scss" global>
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

	// Toasts
	:root {
		.toast-success {
			--toastBackground: var(--alert-success);
			--toastBarBackground: var(--green);
		}

		.toast-error {
			// FIXME: Should use color() here but didn't work before
			--toastBackground: var(--alert-failure);
			--toastBarBackground: var(--white);
		}
	}
</style>
