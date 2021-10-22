<script setup lang="ts">
import { onBeforeMount } from "vue";

onBeforeMount(() => {
	// Clear the teleport target before we get here to replace it
	// Vue does not do this automatically

	const target = document.querySelector("#nav-title");
	target.innerHTML = "&#8203;"; // zero-width space, but still tall, for text-height constraints
});
</script>

<template>
	<teleport to="#nav-title">
		<span><slot /></span>
	</teleport>
</template>
