<script setup lang="ts">
defineProps({
	title: { type: String, required: true },
});
</script>

<template>
	<nav>
		<h1>{{ title }}</h1>

		<aside id="nav-actions" />
	</nav>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

nav {
	position: relative;
	background-color: color($navbar-background);
	text-align: center;
	padding: 0.8em 0;

	h1 {
		margin: 0;
		user-select: none;
	}

	aside#nav-actions {
		$margin: 0.75em;

		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		justify-content: space-evenly;
		height: calc(100% - #{$margin} * 2);
		min-width: 2.8em;
		margin: $margin;
		margin-right: 1em;
	}
}
</style>
