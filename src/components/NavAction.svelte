<script lang="ts">
	import Portal from "svelte-portal";

	export let direction: "leading" | "trailing" = "trailing";
</script>

<Portal target={`#nav-actions-${direction}`}>
	<slot />
</Portal>
