<script setup lang="ts">
import type { PropType } from "vue";
import Chevron from "../icons/Chevron.vue";

defineProps({
	to: { type: String as PropType<string | null>, default: null },
	title: { type: String, required: true },
	subtitle: { type: String as PropType<string | null>, default: null },
	count: { type: [Number, String] as PropType<number | string | null>, default: null },
	subCount: { type: String as PropType<string | null>, default: null },
	negative: { type: Boolean, default: false },
});
</script>

<template>
	<component :is="to === null ? 'div' : 'router-link'" class="list-item" :to="to ?? '#'">
		<slot name="icon" />

		<div class="content">
			<span class="title">{{ title }}</span>
			<span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
		</div>

		<aside>
			<slot name="aside" />
			<div class="counts">
				<span v-if="count !== null" class="count" :class="{ negative: negative }">{{ count }}</span>
				<span v-if="subCount !== null" class="subcount">{{ subCount }}</span>
			</div>
		</aside>

		<Chevron class="chevron" />
	</component>
</template>

<style scoped lang="scss">
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
