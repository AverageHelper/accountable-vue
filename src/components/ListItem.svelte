<script lang="ts">
	import Chevron from "../icons/Chevron.svelte";

	export let to: string | null = null;
	export let title: string;
	export let subtitle: string | null = null;
	export let count: number | string | null = null;
	export let subCount: string | null = null;
	export let negative: boolean = false;
</script>

<svelte:element this={to === null ? "div" : "a"} class="list-item {$$props.class}" href={to ?? "#"}>
	<slot name="icon" />

	<div class="content">
		<span class="title">{title}</span>
		{#if subtitle}
			<span class="subtitle">{subtitle}</span>
		{/if}
	</div>

	<aside>
		<slot name="aside" />
		<div class="counts">
			{#if count !== null}
				<span class="count {negative ? 'negative' : ''}">{count}</span>
			{/if}
			{#if subCount !== null}
				<span class="subcount">{subCount}</span>
			{/if}
		</div>
	</aside>

	<Chevron class="chevron" />
</svelte:element>

<style type="text/scss">
	@use "styles/colors" as *;

	.list-item {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		padding: 0.75em;
		// margin-bottom: 0.5em;
		text-decoration: none;
		border-radius: 4pt;
		color: color($label);
		background-color: color($secondary-fill);

		@media (hover: hover) {
			&:hover {
				background-color: color($gray4);
			}
		}

		.content {
			display: flex;
			flex-direction: column;
			margin-left: 4pt;

			.title {
				font-weight: bold;
			}

			.subtitle {
				padding-top: 4pt;
				color: color($secondary-label);
			}
		}

		aside {
			display: flex;
			flex-flow: row wrap;
			align-items: center;
			margin-left: auto;

			span {
				font-weight: bold;
				min-width: 1em;
				text-align: center;
			}

			> :not(:last-child) {
				margin-right: 8pt;
			}

			> .counts {
				display: flex;
				flex-direction: column;
				align-items: flex-end;

				> .count {
					background-color: color($gray);
					color: color($inverse-label);
					border-radius: 1em;
					padding: 0 0.5em;

					&.negative {
						background-color: color($red);
					}
				}

				> .subcount {
					font-size: small;
					color: color($secondary-label);
					margin-top: 4pt;
					padding: 0 0.5em;
				}
			}
		}

		.chevron {
			color: color($separator);
			margin-left: 8pt;
			user-select: none;
		}
	}
</style>
