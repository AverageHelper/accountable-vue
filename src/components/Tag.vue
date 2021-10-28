<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag } from "../model/Tag";
import TinyButton from "./TinyButton.vue";

defineProps({
	tag: { type: Object as PropType<Tag>, required: true },
	onRemove: { type: Function as PropType<(() => void) | null>, default: null },
});
</script>

<template>
	<div :class="`tag tag--${tag.colorId}`">
		<span>{{ tag.name }}</span>

		<slot />

		<TinyButton v-if="onRemove" class="remove" @click="onRemove()">&times;</TinyButton>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.tag {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	margin-right: 0.5em;
	margin-bottom: 0.4em;
	padding: 0 0.5em;
	color: color($label-dark);
	border-radius: 1em;
	min-width: min-content;
	text-align: left;
	font-weight: bold;
	cursor: default;

	&::before {
		content: "#";
	}

	.remove {
		margin-left: 0.25em;
		display: none;
	}

	@media (hover: hover) {
		&:hover {
			padding-right: 0.4em; // right wall was too thick for the round button

			.remove {
				display: inline-block;
			}
		}
	}

	&--red {
		background-color: color($red);
	}
	&--orange {
		background-color: color($orange);
		color: color($label-light);
	}
	&--yellow {
		background-color: color($yellow);
		color: color($label-light);
	}
	&--green {
		background-color: color($green);
	}
	&--blue {
		background-color: color($blue);
	}
	&--purple {
		background-color: color($purple);
	}
}
</style>
