<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
	to: { type: String as PropType<string | null>, default: null },
	title: { type: String, required: true },
	subtitle: { type: String as PropType<string | null>, default: null },
	count: { type: Number as PropType<number | null>, default: null },
});
</script>

<template>
	<component :is="to === null ? 'div' : 'router-link'" class="list-item" :to="to ?? '#'">
		<div class="content">
			<span class="title">{{ title }}</span>
			<span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
		</div>

		<span v-if="count === null">...</span>
		<span v-else class="count">{{ count }}</span>
	</component>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.list-item {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	justify-content: space-between;
	padding: 0.75em;
	margin-bottom: 0.5em;
	text-decoration: none;
	color: color($label);
	background-color: color($secondary-fill);

	.content {
		display: flex;
		flex-direction: column;

		.title {
			font-weight: bold;
		}

		.subtitle {
			padding-top: 4pt;
			color: color($secondary-label);
		}
	}

	.count {
		font-weight: bold;
		background-color: color($gray);
		color: color($inverse-label);
		border-radius: 1em;
		padding: 0 0.5em;
		min-width: 1em;
		text-align: center;
		user-select: none;
	}
}
</style>
