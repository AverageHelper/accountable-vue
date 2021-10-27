<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag } from "../model/Tag";

defineProps({
	tag: { type: Object as PropType<Tag>, required: true },
});
</script>

<template>
	<div :class="`tag tag--${tag.colorId}`">
		<span>{{ tag.name }}</span>
		<slot />
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.tag {
	margin-right: 0.5em;
	margin-bottom: 0.4em;
	padding: 0 0.5em;
	color: color($label-dark);
	border-radius: 1em;
	min-width: min-content;
	text-align: left;
	font-weight: bold;

	&::before {
		content: "#";
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
