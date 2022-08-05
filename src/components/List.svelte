<script lang="ts">
	let root: HTMLUListElement | undefined;

	export function contains(node: Node | null): boolean {
		return root?.contains(node) ?? false;
	}
</script>

<ul bind:this={root} class={$$props["class"]}>
	<slot />
</ul>

<style lang="scss" global>
	@use "styles/colors" as *;

	// FIXME: This shouldn't be the global style
	ul {
		list-style: none;
		padding: 0;
		max-width: 36em;
		margin: 0 auto;

		.list-item {
			position: relative;
			overflow: hidden;
			margin-bottom: 1pt;

			// FIXME: This looks wrong for the first item
			// &::after {
			// 	content: "";
			// 	display: block;
			// 	position: absolute;
			// 	bottom: 0;
			// 	right: 0;
			// 	width: 92%;
			// 	height: 1pt;
			// 	background-color: color($background);
			// 	user-select: none;
			// }

			// Round the first and last bordered list items
			// &:first-child {
			// 	border-radius: 4pt 4pt 0 0;
			// }

			// &:nth-last-child(2) {
			// 	border-radius: 0 0 4pt 4pt;

			// 	&::after {
			// 		display: none;
			// 	}
			// }
		}
	}
</style>
