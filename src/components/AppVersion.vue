<script setup lang="ts">
import ExternalLink from "./ExternalLink.vue";
import { computed } from "vue";
import { version as v } from "../version";

const version = computed(() => v);
const repositoryUrl = computed(
	() => `https://github.com/AverageHelper/accountable-vue/tree/v${version.value}`
);
</script>

<template>
	<ExternalLink :to="repositoryUrl" title="Check out this project's GitHub"
		>Accountable v{{ version }}</ExternalLink
	>
</template>
