<script setup lang="ts">
import type { PropType } from "vue";
import type { Dinero } from "dinero.js";
import ActionButton from "../buttons/ActionButton.vue";
import TextField from "./TextField.vue";
import { dinero } from "dinero.js";
import { intlFormat } from "../../transformers";
import { ref, computed, toRefs, watch } from "vue";
import { USD } from "@dinero.js/currencies";
import { zeroDinero } from "../../helpers/dineroHelpers";

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	label: { type: String as PropType<string | null>, default: null },
	modelValue: {
		type: Object as PropType<Dinero<number>>,
		default: zeroDinero,
	},
});
const { modelValue } = toRefs(props);

const isIncome = ref(false);

const zeroValue = computed<string>(() => {
	return intlFormat(zeroDinero, "standard");
});
const presentableValue = computed(() => {
	return intlFormat(modelValue.value, "standard");
});

function onInput(event: Event) {
	const input = event.target as HTMLInputElement | null;
	const rawValue = input?.value ?? "";
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
		emit("update:modelValue", dinero({ amount: value, currency: USD }));
	}
}

watch(isIncome, () => {
	updateValue(presentableValue.value);
});

defineExpose({ focus });
</script>

<template>
	<label class="currency-input__container">
		<TextField
			class="currency-input"
			:label="label ?? undefined"
			:model-value="presentableValue"
			:maxlength="18"
			:placeholder="zeroValue"
			@input="onInput"
		/>
		<ActionButton class="negate" @click.prevent="isIncome = !isIncome">{{
			$t("currency.positive-or-negative")
		}}</ActionButton>
	</label>
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
