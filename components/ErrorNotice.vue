<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
	error: {
		type: Object as PropType<Error | string | null>,
		validator: (val: { toString: unknown } | null) => val === null || "toString" in val,
		default: null,
	},
});
</script>

<template>
	<div v-if="error" class="error">{{ error }}</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.error {
	color: color($red);
	word-wrap: break-word;
}
</style>
