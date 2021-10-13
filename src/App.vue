<script setup lang="ts">
import ErrorNotice from "./components/ErrorNotice.vue";
import Navbar from "./components/Navbar.vue";
import { bootstrap, isWrapperInstantiated } from "./transport";
import { computed, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./store/authStore";
import { useUiStore } from "./store/uiStore";

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

const bootstrapError = ref<Error | null>(null);
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

onMounted(() => {
	ui.watchColorScheme();
	if (isWrapperInstantiated()) return;

	try {
		bootstrap();
		auth.watchAuthState();
	} catch (error: unknown) {
		if (error instanceof Error) {
			bootstrapError.value = error;
		} else {
			bootstrapError.value = new Error(JSON.stringify(error));
		}
	}
});
</script>

<template>
	<Navbar :title="title" />
	<main class="content">
		<ErrorNotice :error="bootstrapError" />
		<template v-if="!bootstrapError">
			<keep-alive>
				<router-view />
			</keep-alive>
			<!-- <router-view v-slot="{ Component }">
				<keep-alive>
					<component :is="Component" />
				</keep-alive>
			</router-view> -->
		</template>
	</main>
	<div id="modal" />
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
	margin: 1em;

	.error {
		color: color($red);
	}
}

a {
	color: color($green);
}
</style>
