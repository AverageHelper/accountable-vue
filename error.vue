<script setup lang="ts">
import { clearError } from "nuxt/dist/app";

defineProps({
	error: { type: Object, default: null },
});

async function handleError() {
	await clearError({ redirect: "/" });
}
</script>

<template>
	<main>
		<h1>Something went wrong</h1>
		<button @click.prevent="handleError">Try Again</button>

		<h2>Error description:</h2>
		<pre>{{ error }}</pre>
	</main>
</template>
