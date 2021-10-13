<script lang="ts">
const currentDate = new Date();
currentDate.setSeconds(0, 0);
</script>

<script setup lang="ts">
import type { PropType } from "vue";
import "vue3-date-time-picker/dist/main.css";
import ActionButton from "./ActionButton.vue";
import DatePicker from "vue3-date-time-picker";
import { computed, toRefs } from "vue";
import { useUiStore } from "../store/uiStore";

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	// Sometimes the date will get stringified on the way through. vue3-date-time-picker handles that
	modelValue: { type: [Date, String], default: currentDate },
	label: { type: String, default: "" },
	min: { type: Date as PropType<Date | null>, default: null },
	max: { type: Date as PropType<Date | null>, default: null },
});
const { modelValue, min, max } = toRefs(props);

const ui = useUiStore();

const darkMode = computed(() => ui.preferredColorScheme === "dark");

function reset() {
	const newDate = new Date();
	newDate.setSeconds(0, 0);
	emit("update:modelValue", newDate);
}

function onDateUpdated(date: Date) {
	emit("update:modelValue", date);
}
</script>

<template>
	<div class="date-input">
		<label class="text-input__container">
			<div class="text-input__label">{{ label }}</div>
			<DatePicker
				:is24="false"
				:auto-apply="true"
				:close-on-auto-apply="false"
				:max-date="max"
				:min-date="min"
				:dark="darkMode"
				:model-value="modelValue"
				@update:modelValue="onDateUpdated"
			/>
		</label>
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
