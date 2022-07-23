<script lang="ts">
	import { _ } from "svelte-i18n";
	import { aboutPath, homePath, installPath, loginPath, securityPath } from "../router";
	import { isLoginEnabled } from "../store";
	import { link, useLocation } from "svelte-navigator";

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

	const location = useLocation();
	$: currentPath = $location.pathname;

	function toggle() {
		isNavButtonOpen = !isNavButtonOpen;
	}

	function close() {
		isNavButtonOpen = false;
	}
</script>

<nav class="navbar-147f68de navbar navbar-expand-sm navbar-dark">
	<a
		href={homeRoute}
		class="navbar-brand-9794720e"
		role="heading"
		aria-label={$_("common.accountable")}
		title={$_("common.accountable")}
		use:link>A&cent;countable</a
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
				<span class="visually-hidden">Current Language: {$locale}</span>
				<p class="flag-icon">{$locale}</p>
			</li> -->
			{#each pages as page (page.path)}
				<li class="nav-item {currentPath === page.path ? 'active' : ''}">
					<a
						class="nav-link {currentPath === page.path ? 'active' : ''}"
						href={page.path}
						on:click={close}
						use:link
						>{$_(page.titleKey)}
						{#if currentPath === page.path}
							<span class="visually-hidden">{$_("common.current-aside")}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>

<style lang="scss">
	@use "styles/setup" as *;
	@use "styles/colors" as *;

	// Import only the Bootstrap we need:
	@import "bootstrap/scss/functions";
	@import "bootstrap/scss/variables";
	@import "bootstrap/scss/mixins";
	@import "bootstrap/scss/reboot";
	@import "bootstrap/scss/transitions";
	@import "bootstrap/scss/nav";
	@import "bootstrap/scss/navbar";
	@import "bootstrap/scss/helpers/_visually-hidden.scss";

	$change: 575px;

	.navbar-brand-9794720e {
		display: block;
		font-weight: bold;
		font-size: x-large;
		z-index: 50;
		margin-left: 16pt;
		text-decoration: none;
		color: color($label);

		&:hover {
			color: color($link);
			text-decoration: underline;
		}
	}

	nav.navbar.navbar-147f68de {
		display: flex;
		flex-flow: row nowrap;
		width: 100%;

		#navbarNav {
			@include mq($until: $change) {
				position: absolute;
				top: 1.8em;
				right: 0;
				width: 100%;
			}
		}

		ul,
		.navbar-toggler {
			list-style-type: none;
			margin-left: auto;
			margin-right: 8pt;
			z-index: 50;
		}

		@include mq($until: $change) {
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

		.flag-icon {
			margin: 0;
			padding: 0;
		}

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
