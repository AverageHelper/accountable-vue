<script lang="ts">
	import type { ColorID } from "../../model/Color";
	import { _ } from "svelte-i18n";
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher<{
		input: string;
		change: string;
		focus: FocusEvent;
		blur: FocusEvent;
		keydown: KeyboardEvent;
		keyup: KeyboardEvent;
		keypress: KeyboardEvent;
	}>();

	type TextFieldType =
		| "text"
		| "password"
		| "color"
		| "date"
		| "time"
		| "email"
		| "hidden"
		| "number"
		| "range"
		| "search"
		| "tel"
		| "url";

	export let value: string = "";
	export let dataTest: string | null = null;
	export let placeholder: string | null = null;
	export let type: TextFieldType = "text";
	export let size: number = 20;
	export let maxlength: number = 524288;
	export let min: number | null = null;
	export let max: number | null = null;
	export let autofocus: boolean = false;
	export let autocomplete: string = "";
	export let label: string = "";
	export let disabled: boolean = false;
	export let autocapitalize: string = "none";
	export let required: boolean = false;
	export let showsRequired: boolean = true;
	export let accentColor: ColorID | "" = "";

	let root: HTMLLabelElement | undefined;
	let input: HTMLInputElement | undefined;

	function onInput(event: Event): void {
		const target = event.target as HTMLInputElement | null;
		dispatch("input", target?.value ?? "");
	}

	function onFocus(event: FocusEvent): void {
		dispatch("focus", event);
	}

	function onBlur(event: FocusEvent): void {
		dispatch("blur", event);
	}

	function onChange(event: Pick<InputEvent, "target">): void {
		const target = event.target as HTMLInputElement | null;
		if (target?.value !== value) {
			dispatch("input", target?.value ?? "");
		}
		dispatch("change", target?.value ?? "");
	}

	function onKeyDown(event: KeyboardEvent): void {
		dispatch("keydown", event);
	}

	function onKeyUp(event: KeyboardEvent): void {
		dispatch("keyup", event);
	}

	function onKeyPress(event: KeyboardEvent): void {
		dispatch("keypress", event);
	}

	export function focus(): void {
		input?.focus();
	}

	export function contains(node: Node | null): boolean {
		return root?.contains(node) ?? false;
	}
</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label bind:this={root} class="text-input-c8d2e7c2__container {$$props['class']}">
	<div class="text-input-c8d2e7c2__label" on:click={focus}>
		{label}
		{#if required && showsRequired}
			<span class="text-input-c8d2e7c2__required">{$_("text-input.required")}</span>
		{/if}
	</div>
	{#if disabled}
		<input
			bind:this={input}
			class="text-input-c8d2e7c2 text-input-c8d2e7c2--has-value {accentColor
				? `accent-color-${accentColor}`
				: ''}"
			{value}
			placeholder={placeholder ?? undefined}
			{type}
			{size}
			{maxlength}
			{required}
			data-test={dataTest}
			disabled
		/>
	{:else}
		<!-- svelte-ignore a11y-autofocus -->
		<input
			bind:this={input}
			class="text-input-c8d2e7c2 {accentColor ? `accent-color-${accentColor}` : ''} {value !== ''
				? 'text-input-c8d2e7c2--has-value'
				: ''}"
			{type}
			{size}
			{maxlength}
			min={min ?? undefined}
			max={max ?? undefined}
			{autofocus}
			{autocomplete}
			placeholder={placeholder || (type === "password" ? "********" : "")}
			{autocapitalize}
			{required}
			name={label || placeholder || ""}
			{value}
			data-test={dataTest}
			on:input={onInput}
			on:blur={onBlur}
			on:focus={onFocus}
			on:change={onChange}
			on:keydown={onKeyDown}
			on:keyup={onKeyUp}
			on:keypress={onKeyPress}
		/>
	{/if}

	<slot />
</label>

<style lang="scss" global>
	@use "styles/colors" as *;

	.text-input-c8d2e7c2 {
		display: block;
		border: 0;
		border-bottom: 2px solid color($gray5);
		background-color: color($input-background);
		padding: 0.5em;
		width: 100%;
		font-size: 1em;
		text-overflow: ellipsis;
		transition: all 0.2s ease;
		color: inherit;

		&::placeholder {
			color: color($secondary-label);
		}

		&__container {
			position: relative;
			display: block;
			padding: 0.6em 0;
		}

		&__label {
			display: block;
			color: color($blue);
			user-select: none;
			font-weight: 700;
			font-size: 0.9em;
			width: 100%;
		}

		&__required {
			font-weight: normal;
			font-size: 0.9em;
			color: color($gray2);
		}

		&:focus,
		&:focus-within,
		&.text-input-c8d2e7c2--has-value {
			outline: none;
		}
		&:focus,
		&:focus-within {
			border-bottom-color: color($blue);
		}

		&.accent-color {
			&-red {
				border-bottom-color: color($red);
			}
			&-orange {
				border-bottom-color: color($orange);
			}
			&-yellow {
				border-bottom-color: color($yellow);
			}
			&-green {
				border-bottom-color: color($green);
			}
			&-blue {
				border-bottom-color: color($blue);
			}
			&-purple {
				border-bottom-color: color($purple);
			}
		}

		&:disabled {
			background-color: inherit;
			opacity: 0.7;

			& ~ .text-input-c8d2e7c2__label {
				opacity: 0.7;
			}
		}
	}
</style>
