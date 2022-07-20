<script lang="ts">
	import { _ } from "svelte-i18n";
	import { aboutPath, homePath, installPath, loginPath, securityPath } from "../router";
	import { isLoginEnabled } from "../store";
	import { useRoute } from "vue-router";

	interface Page {
		path: string;
		titleKey: string;
	}

	let isNavButtonOpen = false; // This is exactly what Bootstrap does lol

	const homeRoute = homePath();

	const pages: Array<Page> = [
		{ path: homePath(), titleKey: "home.nav.home" },
		{ path: aboutPath(), titleKey: "home.nav.about" },
		{ path: securityPath(), titleKey: "home.nav.security" },
		{ path: installPath(), titleKey: "home.nav.install" },
	];

	if (isLoginEnabled) {
		pages.push({ path: loginPath(), titleKey: "home.nav.log-in" });
	}

	const route = useRoute();
	$: currentPath = route.path;

	function toggle() {
		isNavButtonOpen = !isNavButtonOpen;
	}

	function close() {
		isNavButtonOpen = false;
	}
</script>

<nav class="navbar navbar-expand-sm navbar-dark">
	<!-- TODO: I18N -->
	<router-link to={homeRoute} class="navbar-brand" role="text" aria-label="Accountable"
		>A&cent;countable</router-link
	>
	<button
		class="navbar-toggler {!isNavButtonOpen ? 'collapsed' : ''}"
		type="button"
		data-bs-toggle="collapse"
		data-bs-target="#navbarNav"
		aria-controls="navbarNav"
		aria-expanded={isNavButtonOpen}
		aria-label="Toggle navigation"
		on:click={toggle}
	>
		<span class="navbar-toggler-icon" />
	</button>

	<div id="navbarNav" class="collapse navbar-collapse {isNavButtonOpen ? 'show' : ''}">
		<ul class="navbar-nav mr-auto">
			<!-- <li class="nav-item">
				<span class="visually-hidden">Current Language: {currentLocale.language}</span>
				<p class="flag-icon">{currentLocale.flag}</p>
			</li> -->
			{#each pages as page (page.path)}
				<li class="nav-item {currentPath === page.path ? 'active' : ''}">
					<router-link
						class="nav-link {currentPath === page.path ? 'active' : ''}"
						:to="page.path"
						on:click={close}
						>{$_(page.titleKey)}
						{#if currentPath === page.path}
							<span class="visually-hidden">{$_("common.current-aside")}</span>
						{/if}
					</router-link>
				</li>
			{/each}
		</ul>
	</div>
</nav>

<style type="text/scss">
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
