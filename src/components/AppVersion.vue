<script setup lang="ts">
import { computed } from "vue";
import { version as v } from "../version";

const version = computed(() => v);
const repositoryUrl = computed(
	() => `https://github.com/AverageHelper/accountable-vue/tree/v${version.value}`
);
</script>

<template>
	<a :href="repositoryUrl" target="_blank" title="Check out this project's GitHub"
		>Accountable v{{ version }}</a
	>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

a {
	color: color($secondary-label);
	text-decoration: none;

	@media (hover: hover) {
		&:hover {
			text-decoration: underline;
		}
	}
}
</style>
