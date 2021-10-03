<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "./components/Navbar.vue";

const route = useRoute();

const title = computed<string>(() => {
	const titleGetter = route.meta.title;
	if (typeof titleGetter === "string") {
		return titleGetter;
	}
	return titleGetter();
});
</script>

<template>
	<Navbar :title="title" />
	<main class="content">
		<keep-alive>
			<router-view />
		</keep-alive>
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
