<script setup lang="ts">
import { computed } from "vue";
import { version as v } from "../version";

const version = computed(() => v);
</script>

<template>
	<p>Accountable v{{ version }}</p>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

p {
	color: color($secondary-label);
	margin: 0;
}
</style>
