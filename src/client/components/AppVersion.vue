<script setup lang="ts">
import GitHubIcon from "../icons/GitHub.vue";
import { computed } from "vue";
import { version as v } from "../version";

const version = computed(() => v);
const repositoryUrl = computed(
	() => `https://github.com/AverageHelper/accountable-vue/tree/v${version.value}`
);
</script>

<template>
	<div class="version">
		<a :href="repositoryUrl" target="_blank"><GitHubIcon /></a>
		<a :href="repositoryUrl" target="_blank">Accountable v{{ version }}</a>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.version {
	display: flex;
	flex-flow: row nowrap;
	color: color($secondary-label);
	margin: 0;

	.icon {
		margin-right: 4pt;
	}

	a {
		color: color($secondary-label);
		text-decoration: none;

		@media (hover: hover) {
			&:hover {
				text-decoration: underline;
			}
		}
	}
}
</style>
