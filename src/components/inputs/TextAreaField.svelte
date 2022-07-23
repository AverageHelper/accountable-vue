<script lang="ts">
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher<{
		input: string;
		focus: FocusEvent;
		blur: Event;
	}>();

	export let value: string = "";
	export let dataTest: string | undefined = undefined;
	export let type: string = "text";
	export let maxlength: number | undefined = undefined;
	export let label: string = "";
	export let disabled: boolean = false;
	export let placeholder: string = "";

	let input: HTMLTextAreaElement | undefined;

	function onInput(event: Event) {
		const target = event.target as HTMLTextAreaElement | null;
		dispatch("input", target?.value);
	}

	export function focus() {
		const target = input;
		target?.focus();
	}

	function onFocus(event: FocusEvent) {
		dispatch("focus", event);
	}

	function onBlur(event: Event) {
		dispatch("blur", event);
	}
</script>

<label class="text-area-b9986ff2__container" data-test={dataTest}>
	<span class="text-area-b9986ff2__label" on:click={focus}>{label}</span>
	{#if disabled}
		<textarea
			bind:this={input}
			class="text-area-b9986ff2 text-area-b9986ff2--has-value"
			type="text"
			{maxlength}
			value={value || "--"}
			{placeholder}
			disabled
		/>
	{:else}
		<textarea
			bind:this={input}
			class="text-area-b9986ff2 {value !== '' ? 'text-area-b9986ff2--has-value' : ''}"
			{value}
			{type}
			{maxlength}
			{placeholder}
			on:input={onInput}
			on:blur={onBlur}
			on:focus={onFocus}
		/>
	{/if}
</label>

<style lang="scss" global>
	@use "styles/colors" as *;

	.text-area-b9986ff2 {
		border: 0;
		border-bottom: 2px solid color($gray5);
		background-color: color($input-background);
		color: color($label);
		padding: 0.5em;
		width: 100%;
		height: 8em;
		font-size: 1em;
		display: block;
		resize: none;
		overflow: scroll;
		text-align: left;

		&::placeholder {
			color: color($secondary-label);
		}

		&__container {
			position: relative;
			display: block;
			padding: 0.6em 0 0.6em;
		}

		&__label {
			display: block;
			font-size: 1em;
			user-select: none;
			cursor: text;
			transform: none;
			color: var(--blue);
			font-weight: 700;
			font-size: 0.9em;
		}

		&:focus,
		&.text-area-b9986ff2--has-value {
			outline: none;
		}
		&:focus {
			border-bottom-color: color($blue);
		}

		&:disabled {
			opacity: 0.7;

			& ~ .text-area-b9986ff2__label {
				opacity: 0.7;
			}
		}
	}
</style>
