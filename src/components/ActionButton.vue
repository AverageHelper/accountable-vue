<script setup lang="ts">
import type { PropType } from "vue";

type ActionButtonType = "button" | "submit" | "reset";
type ActionButtonKind =
	| "plain"
	| "bordered"
	| "bordered-destructive"
	| "bordered-primary"
	| "bordered-primary-green"
	| "bordered-secondary";

const emit = defineEmits(["click", "focus", "blur"]);

defineProps({
	type: { type: String as PropType<ActionButtonType>, default: "button" },
	kind: { type: String as PropType<ActionButtonKind>, default: "plain" },
	disabled: { type: Boolean, default: false },
});

function onClick(event: Event): void {
	emit("click", event);
}

function onFocus(event: Event): void {
	emit("focus", event);
}

function onBlur(event: Event): void {
	emit("blur", event);
}
</script>

<template>
	<button
		:class="`kind--${kind}`"
		:disabled="disabled"
		@focus="onFocus"
		@blur="onBlur"
		@click="onClick"
	>
		<slot />
	</button>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

button {
	display: block;
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
		&--bordered-primary,
		&--bordered-primary-green,
		&--bordered-secondary {
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

			&-primary-green {
				background-color: color($green);
				color: color($label-dark);

				@media (hover: hover) {
					&:hover {
						background-color: color($green-highlight);
					}
				}
			}

			&-secondary {
				background-color: color($gray2);
				color: color($label-dark);

				@media (hover: hover) {
					&:hover {
						background-color: color($gray-highlight);
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
