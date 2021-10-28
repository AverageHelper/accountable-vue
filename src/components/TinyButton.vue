<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
</script>

<template>
	<ActionButton class="tiny"><slot /></ActionButton>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.tiny {
	min-height: 12pt;
	min-width: 12pt;
	font-size: small;
	text-align: center;

	@media (hover: hover) {
		&:hover {
			background-color: color($transparent-gray);
		}
	}
}
</style>
