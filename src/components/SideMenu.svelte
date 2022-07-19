<script lang="ts">
	import type { ComponentType } from "svelte";
	import { _ } from "svelte-i18n";
	import { appTabs, iconForTab, labelIdForTab, routeForTab } from "../model/ui/tabs";
	import { lockPath, logoutPath, settingsPath } from "../router";
	import { onDestroy, onMount } from "svelte";
	import { useAuthStore } from "../store";
	import ActionButton from "./buttons/ActionButton.svelte";
	import AppVersion from "./AppVersion.svelte";
	import DiskUsage from "./DiskUsage.svelte";
	import Gear from "../icons/Gear.svelte";
	import List from "./List.svelte";
	import Lock from "../icons/Lock.svelte";
	import LogOut from "../icons/LogOut.svelte";
	import MenuIcon from "../icons/Menu.svelte";
	import Portal from "svelte-portal";

	interface MenuItem {
		id: string;
		path: string;
		requiresLogin?: boolean;
		icon?: ComponentType | null;
	}

	const auth = useAuthStore();

	let isMenuOpen = false;
	$: isLoggedIn = auth.uid !== null;
	$: isUnlocked = auth.pKey !== null;
	$: hasItems = isLoggedIn;

	let windowWidth = window.innerWidth;
	$: isTabletWidth = windowWidth < 768;

	let settingsItems: Array<MenuItem> = [];

	if (isUnlocked) {
		settingsItems.push(
			{
				id: "app.nav.settings",
				path: settingsPath(),
				requiresLogin: true,
				icon: Gear,
			},
			{
				id: "app.nav.lock",
				path: lockPath(),
				requiresLogin: true,
				icon: Lock,
			}
		);
	}

	settingsItems.push({
		id: "app.nav.log-out",
		path: logoutPath(),
		requiresLogin: true,
		icon: LogOut,
	});

	if (isTabletWidth) {
		settingsItems.unshift(
			...appTabs.map<MenuItem>(tab => ({
				id: labelIdForTab(tab),
				path: routeForTab(tab),
				requiresLogin: true,
				icon: iconForTab(tab),
			}))
		);
	}

	function close() {
		isMenuOpen = false;
	}

	function onResize() {
		windowWidth = window.innerWidth;
	}

	onMount(() => {
		window.addEventListener("resize", onResize);
	});

	onDestroy(() => {
		window.removeEventListener("resize", onResize);
	});
</script>

{#if hasItems}
	<ActionButton on:click={() => (isMenuOpen = !isMenuOpen)}>
		<MenuIcon />
	</ActionButton>
{/if}

<Portal target="body">
	{#if isMenuOpen}
		<div class="side-menu__backdrop" on:click={close} />
	{/if}
	{#if isMenuOpen}
		<List class="side-menu">
			{#each settingsItems as item (item.id)}
				{#if !item.requiresLogin || isLoggedIn}
					<li>
						<router-link to={item.path} on:click={close}>
							{#if item.icon}
								<svelte:component this={item.icon} />
							{/if}
							<span>{$_(item.id)}</span>
						</router-link>
					</li>
				{/if}
			{/each}
			<li>
				<AppVersion class="app-version" />
			</li>
			<li>
				<DiskUsage />
			</li>
		</List>
	{/if}
</Portal>

<style type="text/scss">
	@use "styles/colors" as *;

	.side-menu {
		position: absolute; // assumes our portal target is positioned
		top: 4.5em;
		right: 0;
		background-color: color($secondary-fill);
		width: 100vw;
		max-width: 180pt;
		// TODO: Take mobile "safe area" into account
		max-height: calc(100vh - 4.5em - 16pt); // Screen minus offsets
		text-align: right;
		margin: 0.5em;
		overflow-y: scroll;
		pointer-events: auto; // assumes our portal target has pointer-events: none;

		&__backdrop {
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			background-color: color($transparent-gray);
		}

		li {
			display: flex;

			> a {
				display: block;
				text-decoration: none;
				width: 100%;
				padding: 1em;

				@media (hover: hover) {
					&:hover {
						color: color($label);
						background: color($transparent-gray);
					}
				}

				.icon {
					float: left;
				}
			}

			.app-version {
				width: 100%;
				padding: 1em;
				text-align: center;
			}
		}
	}
</style>
