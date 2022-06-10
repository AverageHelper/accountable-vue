<script setup lang="ts">
import { computed } from "vue";
import { simplifiedByteCount } from "../transformers";
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
	<!-- TODO: I18N -->
	<p class="storage">Used {{ usedSpace }} of {{ totalSpace }}</p>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.storage {
	margin: 8pt auto;
	color: color($secondary-label);
}
</style>
