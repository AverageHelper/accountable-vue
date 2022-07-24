<script lang="ts">
	export let to: string;
	export let title: string | undefined = undefined;
</script>

<a href={to} target="_blank" rel="noopener noreferrer" {title} class={$$props["class"]}>
	<slot />
</a>
