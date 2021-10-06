<script setup lang="ts">
defineProps({
	direction: {
		type: String,
		validator: (val: string) => ["leading", "trailing"].includes(val),
		default: "trailing",
	},
});
</script>

<template>
	<teleport :to="`#nav-actions-${direction}`">
		<slot />
	</teleport>
</template>
