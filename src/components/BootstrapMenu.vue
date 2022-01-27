<script setup lang="ts">
import "bootstrap";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

interface Page {
	path: string;
	title: string;
}

const navButton = ref<HTMLButtonElement | null>(null);

const pages = computed<Array<Page>>(() => [
	{ path: "/", title: "Home" },
	{ path: "/about", title: "About" },
	{ path: "/security", title: "Security" },
	{ path: "/pricing", title: "Pricing" },
	{ path: "/login", title: "Login" },
]);

const route = useRoute();
const currentPath = computed(() => route.path);

/**
 * Clicks the nav button if Bootstrap indicates that the menu is open.
 */
function closeNav() {
	const button = navButton.value;
	// For some reason, button.ariaExpanded is undefined, even when button is defined
	const isExpanded = button?.attributes.getNamedItem("aria-expanded")?.value === "true";
	if (isExpanded) button?.click();
}
</script>

<template>
	<nav class="navbar navbar-expand-sm navbar-dark">
		<router-link to="/" class="navbar-brand" role="text" aria-label="Accountable"
			>A&cent;countable</router-link
		>
		<button
			ref="navButton"
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarNav"
			aria-controls="navbarNav"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon" />
		</button>

		<div id="navbarNav" class="collapse navbar-collapse">
			<ul class="navbar-nav mr-auto">
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
						@click="closeNav"
						>{{ page.title }}
						<span v-if="currentPath === page.path" class="visually-hidden">(current)</span>
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
</style>
