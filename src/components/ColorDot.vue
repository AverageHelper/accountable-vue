<script setup lang="ts">
import type { ColorID } from "../model/Color";
import type { PropType } from "vue";

defineProps({
	colorId: { type: String as PropType<ColorID>, default: "blue" },
});
</script>

<template>
	<div :class="`dot dot--${colorId}`">
		<slot />
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.dot {
	width: 2em;
	height: 2em;
	border-radius: 50%;
	user-select: none;

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
