<script setup lang="ts">
import type { ColorID } from "../../model/Color";
import type { PropType } from "vue";
import { allColors } from "../../model/Color";
import ColorDot from "./../ColorDot.vue";
import List from "./../List.vue";
import { computed } from "vue";

const emit = defineEmits(["update:modelValue"]);

defineProps({
	modelValue: { type: String as PropType<ColorID | null>, default: null },
});

const colors = computed(() => allColors);

function select(colorId: ColorID) {
	emit("update:modelValue", colorId);
}
</script>

<template>
	<List>
		<li v-for="colorId in colors" :key="colorId">
			<ColorDot
				:color-id="colorId"
				:class="{ selected: colorId === modelValue }"
				tabindex="0"
				@keyup.space="select(colorId)"
				@click="select(colorId)"
			>
				<div class="check" />
			</ColorDot>
		</li>
	</List>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

ul {
	display: flex;
	flex-flow: row wrap;
	align-items: center;
	justify-content: center;
	min-height: 4.5em;

	li {
		margin-left: 0.5em;

		.dot {
			cursor: pointer;
			width: 3em;
			height: 3em;
			transition-property: width, height;
			transition-duration: 0.23s;
			display: flex;
			align-items: center;
			justify-content: center;

			.check {
				border-radius: 50%;
				width: 0;
				height: 0;
				transition-property: width, height, background-color;
				transition-duration: 0.23s;
				background-color: color($background);
			}

			&:focus {
				outline: none;
				width: 2.5em;
				height: 2.5em;
			}

			&.selected {
				width: 4em;
				height: 4em;

				.check {
					width: 1em;
					height: 1em;
				}
			}
		}
	}

	li:first-child {
		margin: 0;
	}
}
</style>
