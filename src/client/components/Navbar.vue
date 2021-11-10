<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import TabBar from "./TabBar.vue";
import SideMenu from "./SideMenu.vue";
import { APP_ROOTS } from "../router";
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../store";

defineProps({
	title: { type: String, required: true },
});

const auth = useAuthStore();

const router = useRouter();
const route = useRoute();
const isRoute = computed(() => APP_ROOTS.includes(route.path));
const isLoggedIn = computed(() => auth.uid !== null);

function goBack() {
	router.back();
}
</script>

<template>
	<nav class="navbar">
		<aside class="leading-actions actions-container">
			<ActionButton v-show="!isRoute" @click="goBack">
				<span>&lt;</span>
			</ActionButton>
			<div id="nav-actions-leading" class="actions-container" />
		</aside>

		<h1 id="nav-title">{{ title }}</h1>

		<aside class="trailing-actions actions-container">
			<div id="nav-actions-trailing" class="actions-container" />
			<SideMenu />
		</aside>
	</nav>
	<TabBar v-if="isLoggedIn" class="tab-bar" />
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.navbar {
	position: relative;
	background-color: color($navbar-background);
	color: color($label-dark);
	text-align: center;
	padding: 0.8em 0;

	h1 {
		color: inherit;
		margin: 0 44pt;
		user-select: none;
	}

	.actions-container {
		$margin: 0.75em;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		justify-content: space-evenly;
		height: calc(100% - #{$margin} * 2);
		min-width: 2.8em;
		margin: $margin 1em;
		color: inherit;
	}

	.leading-actions {
		position: absolute;
		top: 0;
		left: 0;
	}

	.trailing-actions {
		position: absolute;
		top: 0;
		right: 0;
	}
}

.tab-bar {
	width: 100%;
}
</style>
