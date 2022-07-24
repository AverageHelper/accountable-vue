<script lang="ts">
	import type { ComponentType } from "svelte";
	import { _ } from "svelte-i18n";
	import { appTabs, iconForTab, labelIdForTab, routeForTab } from "../model/ui/tabs";
	import { Link } from "svelte-navigator";
	import { lockPath, logoutPath, settingsPath } from "../router";
	import { onDestroy, onMount } from "svelte";
	import { pKey, uid } from "../store";
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
		isTab: boolean;
	}

	let isMenuOpen = false;
	$: isLoggedIn = $uid !== null;
	$: isUnlocked = $pKey !== null;
	$: hasItems = isLoggedIn;

	let windowWidth = window.innerWidth;
	$: isTabletWidth = windowWidth < 768;

	function isNotNull<T>(tbd: T | null): tbd is T {
		return tbd !== null;
	}

	let settingsItems: Array<MenuItem>;
	$: settingsItems = [
		isUnlocked
			? {
					id: "app.nav.settings",
					path: settingsPath(),
					requiresLogin: true,
					icon: Gear,
					isTab: false,
			  }
			: null,
		isUnlocked
			? {
					id: "app.nav.lock",
					path: lockPath(),
					requiresLogin: true,
					icon: Lock,
					isTab: false,
			  }
			: null,
		{
			id: "app.nav.log-out",
			path: logoutPath(),
			requiresLogin: true,
			icon: LogOut,
			isTab: false,
		},
	].filter(isNotNull);

	$: if (isTabletWidth) {
		// Clear and re-add tab items
		settingsItems = settingsItems.filter(item => !item.isTab);
		settingsItems = appTabs
			.map<MenuItem>(tab => ({
				id: labelIdForTab(tab),
				path: routeForTab(tab),
				requiresLogin: true,
				icon: iconForTab(tab),
				isTab: true,
			}))
			.concat(settingsItems);
	} else {
		// Clear tab items
		settingsItems = settingsItems.filter(item => !item.isTab);
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
		<div class="side-menu-cb187fca__backdrop" on:click={close} />
	{/if}
	{#if isMenuOpen}
		<List class="side-menu-cb187fca">
			{#each settingsItems as item (item.id)}
				{#if !item.requiresLogin || isLoggedIn}
					<li>
						<Link to={item.path} on:click={close}>
							{#if item.icon}
								<svelte:component this={item.icon} />
							{/if}
							<span>{$_(item.id)}</span>
						</Link>
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

<style lang="scss" global>
	@use "styles/colors" as *;

	.side-menu-cb187fca {
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
