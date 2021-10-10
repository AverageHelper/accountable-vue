<script setup lang="ts">
import type { PropType } from "vue";
import { ref } from "vue";

const emit = defineEmits(["update:modelValue", "focus", "blur"]);

defineProps({
	modelValue: { type: String, default: "" },
	dataTest: { type: String as PropType<string | null>, default: null },
	type: { type: String, default: "text" },
	maxlength: { type: String, default: "" },
	label: { type: String, default: "" },
	disabled: { type: Boolean, default: false },
	placeholder: { type: String, default: "" },
});

const input = ref<HTMLTextAreaElement | null>(null);

function onInput(event: Event) {
	const target = event.target as HTMLTextAreaElement | null;
	emit("update:modelValue", target?.value);
}

function focus() {
	const target = input.value;
	target?.focus();
}

function onFocus(event: FocusEvent) {
	emit("focus", event);
}

function onBlur(event: Event) {
	emit("blur", event);
}

defineExpose({ focus });
</script>

<template>
	<label class="text-area__container">
		<span class="text-area__label" @click="focus">{{ label }}</span>
		<textarea
			v-if="disabled"
			ref="input"
			class="text-area text-area--has-value"
			type="text"
			:maxlength="maxlength"
			:value="modelValue || '--'"
			:placeholder="placeholder"
			disabled
		/>
		<textarea
			v-else
			ref="input"
			:class="['text-area', { 'text-area--has-value': modelValue !== '' }]"
			:value="modelValue"
			:type="type"
			:maxlength="maxlength"
			:placeholder="placeholder"
			@input="onInput"
			@blur="onBlur"
			@focus="onFocus"
		/>
	</label>
</template>

<style lang="scss">
@use "styles/colors" as *;

.text-area {
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
		color: color($gray4);
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
	&.text-area--has-value {
		outline: none;
	}
	&:focus {
		border-bottom-color: color($blue);
	}

	&:disabled {
		opacity: 0.7;

		& ~ .text-area__label {
			opacity: 0.7;
		}
	}
}
</style>
