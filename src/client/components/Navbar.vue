<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import TabBar from "./TabBar.vue";
import SideMenu from "./SideMenu.vue";
import { APP_ROOTS } from "../router";
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../store";

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

		<TabBar v-if="isLoggedIn" class="tab-bar" />
		<h1 v-else id="nav-title" />

		<aside class="trailing-actions actions-container">
			<div id="nav-actions-trailing" class="actions-container" />
			<SideMenu />
		</aside>
	</nav>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.navbar {
	position: relative;
	text-align: center;
	height: 44pt;
	background-color: color($navbar-background);
	color: color($label-dark);

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

	.tab-bar {
		height: 100%;
	}
}
</style>
