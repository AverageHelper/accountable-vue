<script setup lang="ts">
const emit = defineEmits(["update:modelValue"]);

defineProps({
	modelValue: { type: Boolean, required: true },
	disabled: { type: Boolean, default: false },
	label: { type: String, default: "" },
});

function sendValue(value: boolean): void {
	emit("update:modelValue", value);
}

function onChange(event: Event): void {
	const checkbox = event.target as HTMLInputElement | null;
	sendValue(checkbox?.checked ?? false);
}
</script>

<template>
	<label class="checkbox">
		<input type="checkbox" :checked="modelValue" :disabled="disabled" @change="onChange" />
		<label class="mark" :class="{ disabled: disabled }" @click="sendValue(!modelValue)" />
		<span v-if="label" class="label" :class="{ disabled: disabled }">{{ label }}</span>
	</label>
</template>

<style scoped lang="scss">
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
