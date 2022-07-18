<script lang="ts">
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher<{ change: boolean }>();

	export let value: boolean;
	export let disabled: boolean = false;
	export let label: string = "";

	function sendValue(value: boolean): void {
		dispatch("change", value);
	}

	function onChange(event: Event): void {
		if (disabled) return;
		const checkbox = event.target as HTMLInputElement | null;
		sendValue(checkbox?.checked ?? false);
	}

	function toggle() {
		sendValue(!value);
	}

	function onKeyup(event: KeyboardEvent) {
		if (event.key !== " " && event.key !== "Spacebar") return;
		event.stopPropagation();
		toggle();
	}
</script>

<label class="checkbox" tabindex="0" on:keyup={onKeyup}>
	<input type="checkbox" checked={value} {disabled} on:change={onChange} />
	<label class="mark {disabled ? 'disabled' : ''}" on:click={toggle} />
	{#if label}
		<span class="label {disabled ? 'disabled' : ''}">{{ label }}</span>
	{/if}
</label>

<style type="text/scss">
	@use "styles/colors" as *;

	.checkbox {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		min-height: 33pt;
		cursor: pointer;

		.mark {
			position: relative;
			margin: 0;
			margin-top: 0.2em;
			margin-right: 0.4em;
			width: 1.8em;
			height: 1.8em;
			float: left;
			border-radius: 0.4em;
			border: 2pt solid color($transparent-gray);
			cursor: pointer;
			transition: all 0.1s ease;

			&.disabled {
				cursor: default;
				color: color($secondary-label);
				background: color($gray4);
			}

			&:after {
				content: "";
				width: 0.9em;
				height: 0.35em;
				position: absolute;
				top: 0.35em;
				left: 0.25em;
				border: 0.3em solid color($label);
				border-top: none;
				border-right: none;
				background: transparent;
				opacity: 0;
				transform: rotate(-45deg);
				transition: all 0.1s ease;
			}
		}

		.label {
			text-align: left;
			user-select: none;

			&.disabled {
				color: color($secondary-label);
			}
		}

		input {
			visibility: hidden;
			position: absolute;

			&:checked + label {
				border-color: color($label);

				&:after {
					opacity: 1;
				}
			}

			&:checked:disabled {
				background: color($gray4);
				border-color: color($gray4);
			}

			&:disabled + label {
				background: color($gray4);
				border-color: color($gray4);
			}
		}
	}
</style>
