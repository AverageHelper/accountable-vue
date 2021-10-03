<script setup lang="ts">
import PlainButton from "./PlainButton.vue";
import { APP_ROOT } from "../router";
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

defineProps({
	title: { type: String, required: true },
});

const router = useRouter();
const route = useRoute();
const isRoute = computed(() => route.path === APP_ROOT);

function goBack() {
	router.back();
}
</script>

<template>
	<nav>
		<aside class="back">
			<PlainButton v-show="!isRoute" @click="goBack">
				<span>&lt;</span>
			</PlainButton>
		</aside>

		<h1>{{ title }}</h1>

		<aside id="nav-actions" />
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

	aside {
		$margin: 0.75em;

		position: absolute;
		top: 0;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		justify-content: space-evenly;
		height: calc(100% - #{$margin} * 2);
		min-width: 2.8em;
		margin: $margin 1em;
		color: inherit;

		&.back {
			left: 0;
		}

		&#nav-actions {
			right: 0;
		}
	}
}
</style>
