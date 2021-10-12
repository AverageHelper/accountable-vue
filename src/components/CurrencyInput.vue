<script setup lang="ts">
import type { PropType } from "vue";
import ActionButton from "./ActionButton.vue";
import TextField from "./TextField.vue";
import { ref, computed, toRefs, watch } from "vue";

type CurrencyCode = "USD";

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	label: { type: String as PropType<string | null>, default: null },
	modelValue: { type: Number, default: 0 },
	currency: { type: String as PropType<CurrencyCode>, default: "USD" },
});
const { currency, modelValue } = toRefs(props);

const isIncome = ref(true);

const formatter = computed(() => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency.value,
	});
});

const presentableValue = computed(() => {
	return formatter.value.format(modelValue.value);
});

function onInput(event: Event) {
	const input = event.target as HTMLInputElement | null;
	const rawValue = input.value ?? "";
	updateValue(rawValue);
}

function updateValue(rawValue: string) {
	const numbersOnly = rawValue.replace(/\D/gu, "");
	let value = Number.parseInt(numbersOnly, 10);
	if (!isIncome.value) {
		value = -value;
	}
	if (Number.isNaN(value) || rawValue === "") {
		emit("update:modelValue", modelValue.value);
	} else {
		emit("update:modelValue", value / 100);
	}
}

watch(isIncome, () => {
	updateValue(presentableValue.value);
});

defineExpose({ focus });
</script>

<template>
	<div class="currency-input__container">
		<TextField
			class="currency-input"
			:label="label"
			:model-value="presentableValue"
			:maxlength="18"
			placeholder="0.00"
			@input="onInput"
		/>
		<ActionButton class="negate" @click.prevent="isIncome = !isIncome">+/-</ActionButton>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.currency-input {
	&__container {
		position: relative;

		.negate {
			position: absolute;
			right: 2pt;
			bottom: 19%;
			font-size: 100%;
			min-height: 1em;
			min-width: 2em;
			height: 2em;
			border-radius: 4pt;

			@media (hover: hover) {
				&:hover {
					background: color($gray4);
				}

				&:hover:disabled {
					background: none;
				}
			}
		}
	}
}
</style>
