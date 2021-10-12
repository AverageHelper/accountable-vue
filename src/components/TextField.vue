<script setup lang="ts">
import type { PropType } from "vue";
import { ref, toRefs } from "vue";

const emit = defineEmits([
	"update:modelValue",
	"focus",
	"blur",
	"change",
	"keydown",
	"keyup",
	"keypress",
]);

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

const props = defineProps({
	modelValue: { type: String, default: "" },
	dataTest: { type: String as PropType<string | null>, default: null },
	placeholder: { type: String as PropType<string | null>, default: null },
	type: { type: String as PropType<TextFieldType>, default: "text" },
	size: { type: Number, default: 20 },
	maxlength: { type: Number, default: 524288 },
	min: { type: Number as PropType<number | null>, default: null },
	max: { type: Number as PropType<number | null>, default: null },
	autofocus: { type: Boolean, default: false },
	autocomplete: { type: String, default: "" },
	label: { type: String, default: "" },
	disabled: { type: Boolean, default: false },
	autocapitalize: { type: String, default: "none" },
	required: { type: Boolean, default: false },
	showsRequired: { type: Boolean, default: true },
});
const { modelValue } = toRefs(props);

const input = ref<HTMLInputElement | null>(null);

function onInput(event: Event): void {
	const target = event.target as HTMLInputElement | null;
	emit("update:modelValue", target?.value ?? "");
}

function onFocus(event: FocusEvent): void {
	emit("focus", event);
}

function onBlur(event: FocusEvent): void {
	emit("blur", event);
}

function onChange(event: InputEvent): void {
	const target = event.target as HTMLInputElement | null;
	if (target?.value !== modelValue.value) {
		emit("update:modelValue", target?.value ?? "");
	}
	emit("change", target?.value ?? "");
}

function onKeyDown(event: KeyboardEvent): void {
	emit("keydown", event);
}

function onKeyUp(event: KeyboardEvent): void {
	emit("keyup", event);
}

function onKeyPress(event: KeyboardEvent): void {
	emit("keypress", event);
}

function focus(): void {
	input.value?.focus();
}

defineExpose({ focus });
</script>

<template>
	<label class="text-input__container">
		<div class="text-input__label" @click="focus">
			{{ label }}
			<span v-if="required && showsRequired" class="text-input__required">(required)</span>
		</div>
		<input
			v-if="disabled"
			ref="input"
			class="text-input text-input--has-value"
			:value="modelValue"
			:placeholder="placeholder"
			:type="type"
			:size="size"
			:maxlength="maxlength"
			:required="required"
			:data-test="dataTest"
			disabled
		/>
		<input
			v-else
			ref="input"
			:class="['text-input', { 'text-input--has-value': modelValue !== '' }]"
			:type="type"
			:size="size"
			:maxlength="maxlength"
			:min="min"
			:max="max"
			:autofocus="autofocus"
			:autocomplete="autocomplete"
			:placeholder="placeholder || (type === 'password' ? '********' : '')"
			:autocapitalize="autocapitalize"
			:required="required"
			:name="label || placeholder"
			:value="modelValue"
			:data-test="dataTest"
			@input="onInput"
			@blur="onBlur"
			@focus="onFocus"
			@change="onChange"
			@keydown="onKeyDown"
			@keyup="onKeyUp"
			@keypress="onKeyPress"
		/>

		<slot />
	</label>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.text-input {
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
	&.text-input--has-value {
		outline: none;
	}
	&:focus,
	&:focus-within {
		border-bottom-color: color($blue);
	}

	&:disabled {
		background-color: inherit;
		opacity: 0.7;

		& ~ .text-input__label {
			opacity: 0.7;
		}
	}
}
</style>
