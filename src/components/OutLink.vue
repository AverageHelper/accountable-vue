<script setup lang="ts">
defineProps({
	to: { type: String, default: "" },
});
</script>

<template>
	<a :href="to" target="_blank" v-bind="$attrs"><slot /></a>
</template>
