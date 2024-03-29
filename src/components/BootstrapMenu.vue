<script setup lang="ts">
import { aboutPath, homePath, installPath, loginPath, securityPath } from "../router";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
// import { currentLocale } from "../i18n";

interface Page {
	path: string;
	titleKey: string;
}

const navButton = ref<HTMLButtonElement | null>(null);
const isNavButtonOpen = ref(false); // This is exactly what Bootstrap does lol
const loginEnabled = computed(() => import.meta.env.VITE_ENABLE_LOGIN === "true");

const homeRoute = computed(() => homePath());

const pages = computed<Array<Page>>(() => {
	const pages: Array<Page> = [
		{ path: homePath(), titleKey: "home.nav.home" },
		{ path: aboutPath(), titleKey: "home.nav.about" },
		{ path: securityPath(), titleKey: "home.nav.security" },
		{ path: installPath(), titleKey: "home.nav.install" },
	];

	if (loginEnabled.value) {
		pages.push({ path: loginPath(), titleKey: "home.nav.log-in" });
	}

	return pages;
});

const route = useRoute();
const currentPath = computed(() => route.path);
</script>

<template>
	<nav class="navbar navbar-expand-sm navbar-dark">
		<!-- TODO: I18N -->
		<router-link :to="homeRoute" class="navbar-brand" role="text" aria-label="Accountable"
			>A&cent;countable</router-link
		>
		<button
			ref="navButton"
			class="navbar-toggler"
			:class="{ collapsed: !isNavButtonOpen }"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarNav"
			aria-controls="navbarNav"
			:aria-expanded="isNavButtonOpen"
			aria-label="Toggle navigation"
			@click="isNavButtonOpen = !isNavButtonOpen"
		>
			<span class="navbar-toggler-icon" />
		</button>

		<div id="navbarNav" class="collapse navbar-collapse" :class="{ show: isNavButtonOpen }">
			<ul class="navbar-nav mr-auto">
				<!-- <li class="nav-item">
					<span class="visually-hidden">Current Language: {{ currentLocale.language }}</span>
					<p class="flag-icon">{{ currentLocale.flag }}</p>
				</li> -->
				<li
					v-for="page in pages"
					:key="page.path"
					class="nav-item"
					:class="{ active: currentPath === page.path }"
				>
					<router-link
						class="nav-link"
						:class="{ active: currentPath === page.path }"
						:to="page.path"
						@click="isNavButtonOpen = false"
						>{{ $t(page.titleKey) }}
						<span v-if="currentPath === page.path" class="visually-hidden">{{
							$t("common.current-aside")
						}}</span>
					</router-link>
				</li>
			</ul>
		</div>
	</nav>
</template>

<style scoped lang="scss">
@use "styles/setup" as *;
@use "styles/colors" as *;
@import "styles/bootstrap"; // Let's only use this here, if we can

.navbar-brand {
	display: block;
	transform: translateX(-50%);
	position: absolute;
	left: 50%;
	font-weight: bold;
	font-size: x-large;
}

@include mq($until: desktop) {
	.navbar-brand {
		width: 100%;
		text-align: left;
		margin-left: 16pt;
	}
}

ul,
.navbar-toggler {
	list-style-type: none;
	position: absolute;
	right: 0;
	margin: 0;
	margin-right: 8pt;
}

@include mq($until: 575px) {
	.navbar {
		position: relative;

		&-nav {
			z-index: 100;
			margin-right: 0;
			margin-top: 22pt;
			padding: 0 8pt;
			text-align: right;
			width: 100%;
			background-color: color($navbar-background);
		}
	}
}

.active {
	font-weight: bold;
}

nav.navbar {
	.nav-item {
		&.active {
			color: color($link);
		}

		@media (hover: hover) {
			.nav-link:hover {
				text-decoration: none;
			}
		}
	}
}

.flag-icon {
	margin: 0;
	padding: 0;
}
</style>
