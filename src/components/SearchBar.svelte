<script lang="ts">
	import { useRoute, useRouter } from "vue-router";
	import ActionButton from "./buttons/ActionButton.svelte";
	import SearchIcon from "../icons/Search.svelte";
	import XIcon from "../icons/X.svelte";
	import TextField from "./inputs/TextField.svelte";

	const route = useRoute();
	const router = useRouter();

	const initialSearchQuery = (route.query["q"] ?? "").toString();

	let searchQuery = initialSearchQuery.trim();
	$: needsCommitSearch = searchQuery.trim() !== initialSearchQuery.trim();

	function commit(event: Event) {
		event.preventDefault();
		const q = searchQuery.trim();
		const query = q ? { q } : {};

		void router.replace({ path: route.path, query });
	}

	function onKeyup(event: CustomEvent<KeyboardEvent>) {
		if (event.detail.code !== "Enter") return;
		event.preventDefault();
		// make sure the key was "enter"
		commit(event);
	}

	function clear(event: Event) {
		event.preventDefault();
		searchQuery = "";
		void router.replace({ path: route.path, query: {} });
	}
</script>

<div class="search {$$props.class}">
	<TextField
		bind:value={searchQuery}
		type="search"
		placeholder="Search"
		class="input"
		on:keyup={onKeyup}
	/>
	{#if needsCommitSearch}
		<ActionButton kind="bordered-primary" on:click={commit}>
			<SearchIcon />
		</ActionButton>
	{/if}
	{#if initialSearchQuery}
		<ActionButton kind="bordered-destructive" on:click={clear}>
			<XIcon />
		</ActionButton>
	{/if}
</div>

<style type="text/scss">
	.search {
		display: flex;
		flex-flow: row nowrap;

		> * {
			margin: 8pt 0;
		}

		> .input {
			flex-grow: 1;
		}

		> *:not(:first-child) {
			margin-left: 8pt;
		}
	}
</style>
