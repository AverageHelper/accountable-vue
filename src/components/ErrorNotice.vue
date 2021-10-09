<script setup lang="ts">
defineProps({
	error: {
		type: [String, Object, null],
		validator: (val: { toString: unknown } | null) => val === null || "toString" in val,
		required: true,
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
