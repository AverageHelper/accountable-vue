<script setup lang="ts">
import type { PropType } from "vue";

type ActionButtonType = "button" | "submit" | "reset";
type ActionButtonKind = "plain" | "bordered" | "bordered-destructive" | "bordered-primary";

const emit = defineEmits(["click"]);

defineProps({
	type: { type: String as PropType<ActionButtonType>, default: "button" },
	kind: { type: String as PropType<ActionButtonKind>, default: "plain" },
	disabled: { type: Boolean, default: false },
});

function onClick(event: Event): void {
	emit("click", event);
}
</script>

<template>
	<button :class="`kind--${kind}`" :disabled="disabled" @click="onClick">
		<slot />
	</button>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

button {
	font-family: inherit;
	font-size: 200%;
	line-height: 1.15;
	margin: 0;
	padding: 0;
	overflow: visible;
	text-transform: none;
	appearance: button;
	cursor: pointer;
	background: none;
	border: none;
	color: inherit;
	min-height: 44pt;
	min-width: 44pt;
	width: fit-content;
	border-radius: 50%;

	&.kind {
		&--bordered,
		&--bordered-destructive,
		&--bordered-primary {
			font-size: 100%;
			font-weight: bold;
			color: color($label);
			background-color: color($secondary-fill);
			margin: 1em 0;
			padding: 0 1em;
			border-radius: 1em;
			min-height: 33pt;

			&:disabled {
				background: none;
			}

			@media (hover: hover) {
				&:hover {
					background-color: color($transparent-gray);
				}
			}

			&-destructive {
				background-color: color($red);

				@media (hover: hover) {
					&:hover {
						background-color: color($red-highlight);
					}
				}
			}

			&-primary {
				background-color: color($blue);
				color: color($label-dark);

				@media (hover: hover) {
					&:hover {
						background-color: color($blue-highlight);
					}
				}
			}
		}
	}

	@media (hover: hover) {
		&:hover {
			background: color($transparent-gray);
		}

		&:hover:disabled {
			background: none;
		}
	}

	&:disabled {
		color: color($secondary-label);
		cursor: default;
	}
}
</style>
