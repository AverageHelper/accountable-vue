<script setup lang="ts">
defineEmits(["click"]);

defineProps({
	disabled: { type: Boolean, default: false },
});
</script>

<template>
	<button :disabled="disabled" @click="$emit('click')">
		<slot />
	</button>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

button {
	font-family: inherit;
	font-size: 200%;
	line-height: 1.15;
	margin: 0;
	overflow: visible;
	text-transform: none;
	appearance: button;
	cursor: pointer;
	background: none;
	border: none;
	color: inherit;
	min-height: 44pt;
	min-width: 44pt;
	border-radius: 50%;

	@media (hover: hover) {
		&:hover {
			background: color($transparent-gray);
		}

		&:hover:disabled {
			background: none;
		}
	}

	&:disabled {
		color: color($secondary-label);
		cursor: default;
	}
}
</style>
