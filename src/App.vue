<script setup lang="ts">
import Accounts from "./components/Accounts.vue";
import Navbar from "./components/Navbar.vue";
</script>

<template>
	<Navbar title="Accounts" />
	<main class="content">
		<Accounts />
	</main>
</template>

<style lang="scss">
@import "styles/setup";

html,
body {
	padding: 0;
	margin: 0;
}

main.content {
	margin: 1em;
}
</style>
