<script setup lang="ts">
import { computed } from "vue";
import { simplifiedByteCount } from "@/transformers";
import { useUiStore } from "../store";

const ui = useUiStore();

const totalSpace = computed(() =>
	ui.totalSpace !== null ? simplifiedByteCount(ui.totalSpace) : "--"
);
const usedSpace = computed(() =>
	ui.usedSpace !== null ? simplifiedByteCount(ui.usedSpace) : "--"
);
</script>

<template>
	<i18n-t keypath="common.disk-usage" tag="p">
		<template #used>{{ usedSpace }}</template>
		<template #total>{{ totalSpace }}</template>
	</i18n-t>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.storage {
	margin: 8pt auto;
	color: color($secondary-label);
}
</style>
