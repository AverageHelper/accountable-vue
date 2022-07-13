<script setup lang="ts">
import Navbar from "./components/Navbar.vue";
import { onMounted } from "vue";
import { useUiStore } from "./store/uiStore";

const ui = useUiStore();

onMounted(() => {
	ui.watchColorScheme();
});
</script>

<template>
	<Navbar />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<style lang="scss">
@use "styles/colors" as *;
@import "styles/setup";

#app * {
	box-sizing: border-box;
}

html,
body {
	padding: 0;
	margin: 0;
}

main.content {
	margin: 0;
	padding: 16pt 24pt;
	overflow-y: scroll;
	overflow-x: hidden;
	height: calc(100vh - 44pt);

	.error {
		color: color($red);
	}
}

a {
	color: color($link);
}
</style>
