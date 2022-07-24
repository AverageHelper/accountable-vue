<script lang="ts">
	import { onMount } from "svelte";
	import { useLocation, useNavigate } from "svelte-navigator";
	import ActionButton from "./buttons/ActionButton.svelte";
	import SearchIcon from "../icons/Search.svelte";
	import XIcon from "../icons/X.svelte";
	import TextField from "./inputs/TextField.svelte";

	const location = useLocation();
	const navigate = useNavigate();

	$: queryParams = new URLSearchParams($location.search);
	$: initialSearchQuery = (queryParams.get("q") ?? "").toString();

	let searchQuery = "";

	onMount(() => {
		searchQuery = initialSearchQuery.trim();
	});

	$: needsCommitSearch = searchQuery.trim() !== initialSearchQuery.trim();

	function onSearchQueryChange(event: CustomEvent<string>) {
		searchQuery = event.detail;
	}

	function commit(event: Event) {
		event.preventDefault();
		const q = searchQuery.trim();
		const query = q ? new URLSearchParams({ q }) : new URLSearchParams();

		navigate(`${$location.pathname}?${query.toString()}`, { replace: true });
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
		navigate($location.pathname, { replace: true });
	}
</script>

<div class="search-bef4d73e {$$props['class']}">
	<TextField
		value={searchQuery}
		on:input={onSearchQueryChange}
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

<style lang="scss" global>
	.search-bef4d73e {
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
