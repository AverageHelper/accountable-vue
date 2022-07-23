<script lang="ts">
	export let to: string;
</script>

<a
	href={to}
	target="_blank"
	rel="noopener noreferrer"
	title={$$props["title"]}
	class={$$props["class"]}
>
	<slot />
</a>
