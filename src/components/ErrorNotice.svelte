<script lang="ts">
	export let error: Error | string | null = null;
</script>

{#if error}
	<div class="error">{error}</div>
{/if}

<style lang="scss">
	@use "styles/colors" as *;

	.error {
		color: color($red);
		word-wrap: break-word;
	}
</style>
