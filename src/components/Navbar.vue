<script setup lang="ts">
import ActionButton from "./ActionButton.vue";

import { APP_ROOTS } from "../router";
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import SideMenu from "./SideMenu.vue";

defineProps({
	title: { type: String, required: true },
});

const router = useRouter();
const route = useRoute();
const isRoute = computed(() => APP_ROOTS.includes(route.path));

function goBack() {
	router.back();
}
</script>

<template>
	<nav>
		<aside class="leading-actions actions-container">
			<ActionButton v-show="!isRoute" @click="goBack">
				<span>&lt;</span>
			</ActionButton>
			<div id="nav-actions-leading" class="actions-container" />
		</aside>

		<h1>{{ title }}</h1>

		<aside class="trailing-actions actions-container">
			<div id="nav-actions-trailing" class="actions-container" />
			<SideMenu />
		</aside>
	</nav>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

nav {
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
</style>
