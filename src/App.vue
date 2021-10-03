<script setup lang="ts">
import Navbar from "./components/Navbar.vue";

import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const title = computed<string>(() => {
	const titleOrGetter = route.meta.title;
	if (titleOrGetter === undefined) {
		return "Home";
	}
	if (typeof titleOrGetter === "string") {
		return titleOrGetter;
	}
	return titleOrGetter();
});
</script>

<template>
	<Navbar :title="title" />
	<main class="content">
		<keep-alive>
			<router-view />
		</keep-alive>
		<!-- <router-view v-slot="{ Component }">
			<keep-alive>
				<component :is="Component" />
			</keep-alive>
		</router-view> -->
	</main>
</template>

<style lang="scss">
@use "styles/colors" as *;
@import "styles/setup";

html,
body {
	padding: 0;
	margin: 0;
}

main.content {
	margin: 1em;
}

a {
	color: color($green);
}
</style>
