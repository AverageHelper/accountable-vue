<script setup lang="ts">
import { ref } from "vue";

const root = ref<HTMLUListElement | null>(null);

function contains(node: Node | null): boolean {
	return root.value?.contains(node) ?? false;
}

defineExpose({ contains });
</script>

<template>
	<ul ref="root">
		<slot />
	</ul>
</template>

<style scoped lang="scss">
ul {
	list-style: none;
	padding: 0;
	max-width: 36em;
	margin: 0 auto;
}
</style>
