<script lang="ts">
	import { _ } from "svelte-i18n";
	import { useUiStore } from "../store";
	import { version as clientVersion } from "../version";
	import OutLink from "./OutLink.svelte";

	const ui = useUiStore();

	$: serverVersion = ui.serverVersion;
	$: loadingError = ui.serverLoadingError;
	$: isLoading = serverVersion === "loading" || typeof serverVersion !== "string";

	void ui.loadServerVersion();

	const repositoryUrl = `https://github.com/AverageHelper/accountable-vue/tree/v${clientVersion}`;
</script>

<OutLink to={repositoryUrl} class={$$props.class}
	>{$_("common.accountable")}
	{$_("common.client")} v{clientVersion},
	{$_("common.server")}
	{#if isLoading}
		<span title={loadingError?.message}>vX.X.X</span>
	{:else}
		v{serverVersion}
	{/if}
</OutLink>
