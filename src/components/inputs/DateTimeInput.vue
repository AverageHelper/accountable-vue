<script lang="ts">
// Loads before `setup` runs
const currentDate = new Date();
currentDate.setSeconds(0, 0); // reset to top of current minute
</script>

<script setup lang="ts">
import type { PropType } from "vue";
import { toRefs } from "vue";
import ActionButton from "../buttons/ActionButton.vue";
import formatDate from "date-fns/format";

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	modelValue: { type: Date, default: currentDate },
	label: { type: String, default: "" },
	min: { type: Date as PropType<Date | null>, default: null },
	max: { type: Date as PropType<Date | null>, default: null },
});
const { modelValue, min, max } = toRefs(props);

function stringFormattedDate(date: Date | null): string | undefined {
	if (date === null) return undefined;
	return formatDate(date, "yyyy-MM-dd'T'HH:mm");
}

function reset() {
	const newDate = new Date();
	newDate.setSeconds(0, 0);
	emit("update:modelValue", newDate);
}

function onDateUpdated(event: Event) {
	const target = event.target as HTMLInputElement | null;
	const date = !target ? null : new Date(target.value);
	emit("update:modelValue", date);
}
</script>

<template>
	<div class="date-input">
		<label class="text-input__container">
			<div class="text-input__label">{{ label }}</div>
			<input
				class="text-input text-input--has-value"
				type="datetime-local"
				pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
				:max="stringFormattedDate(max)"
				:min="stringFormattedDate(min)"
				:value="stringFormattedDate(modelValue)"
				@input="onDateUpdated"
			/>
		</label>
		<!-- TODO: I18N -->
		<ActionButton kind="bordered" @click.prevent="reset">Now</ActionButton>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.date-input {
	display: flex;
	flex-flow: row nowrap;
	align-items: flex-end;

	button {
		padding: 0.4em 0;
		margin: 0.6em 0;
		margin-left: 1em;
		width: -moz-fit-content;
		width: fit-content;
	}
}

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
	box-sizing: border-box;

	&::placeholder {
		color: color($secondary-label);
	}

	&__container {
		display: block;
		padding: 0.6em 0;
		width: 100%;
	}

	&__label {
		display: block;
		color: color($blue);
		user-select: none;
		font-weight: 700;
		font-size: 0.9em;
		width: 100%;
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
