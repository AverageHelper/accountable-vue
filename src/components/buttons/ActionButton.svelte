<script lang="ts">
	import { createEventDispatcher } from "svelte";

	type ActionButtonType = "button" | "submit" | "reset";
	type ActionButtonKind =
		| "plain"
		| "bordered"
		| "bordered-destructive"
		| "bordered-primary"
		| "bordered-primary-green"
		| "bordered-secondary";

	const dispatch = createEventDispatcher<{
		click: MouseEvent;
		focus: FocusEvent;
		blur: FocusEvent;
	}>();

	export let type: ActionButtonType = "button";
	export let kind: ActionButtonKind = "plain";
	export let disabled: boolean = false;

	function onClick(event: MouseEvent): void {
		dispatch("click", event);
	}

	function onFocus(event: FocusEvent): void {
		dispatch("focus", event);
	}

	function onBlur(event: FocusEvent): void {
		dispatch("blur", event);
	}
</script>

<button
	class={`kind--${kind} ${$$props.class}`}
	{type}
	{disabled}
	on:focus={onFocus}
	on:blur={onBlur}
	on:click={onClick}
>
	<slot />
</button>

<style type="text/scss">
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
