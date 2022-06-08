<script setup lang="ts">
import type { Component } from "vue";
import ActionButton from "./buttons/ActionButton.vue";
import AppVersion from "./AppVersion.vue";
import Gear from "../icons/Gear.vue";
import List from "./List.vue";
import LogOut from "../icons/LogOut.vue";
import MenuIcon from "../icons/Menu.vue";
import DiskUsage from "./DiskUsage.vue";
import { appTabs, iconForTab, labelForTab, routeForTab } from "../model/ui/tabs";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { logoutPath, settingsPath } from "../router";
import { useAuthStore } from "../store";

interface MenuItem {
	id: string;
	path: string;
	requiresLogin?: boolean;
	icon?: Component | null;
}

const auth = useAuthStore();

const isMenuOpen = ref(false);
const isLoggedIn = computed(() => auth.uid !== null);
const hasItems = computed(() => isLoggedIn.value);

const windowWidth = ref(window.innerWidth);
const isTabletWidth = computed(() => windowWidth.value < 768);

const settingsItems = computed<Array<MenuItem>>(() => {
	const items: Array<MenuItem> = [
		{
			id: "app.nav.settings",
			path: settingsPath(),
			requiresLogin: true,
			icon: Gear,
		},
		{
			id: "app.nav.log-out",
			path: logoutPath(),
			requiresLogin: true,
			icon: LogOut,
		},
	];

	if (isTabletWidth.value) {
		items.unshift(
			...appTabs.map<MenuItem>(tab => ({
				id: labelForTab(tab),
				path: routeForTab(tab),
				requiresLogin: true,
				icon: iconForTab(tab),
			}))
		);
	}

	return items;
});

function close() {
	isMenuOpen.value = false;
}

function onResize() {
	windowWidth.value = window.innerWidth;
}

onMounted(async () => {
	await nextTick();
	window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
	window.removeEventListener("resize", onResize);
});
</script>

<template>
	<ActionButton v-if="hasItems" @click="isMenuOpen = !isMenuOpen">
		<MenuIcon />
	</ActionButton>

	<teleport to="body">
		<div v-if="isMenuOpen" class="side-menu__backdrop" @click="close"></div>
		<List v-show="isMenuOpen" class="side-menu">
			<template v-for="item in settingsItems" :key="item.id">
				<li v-if="!item.requiresLogin || isLoggedIn">
					<router-link :to="item.path" @click="close">
						<component :is="item.icon" v-if="item.icon" />
						<span>{{ $t(item.id) }}</span>
					</router-link>
				</li>
			</template>
			<li>
				<AppVersion class="app-version" />
			</li>
			<li>
				<DiskUsage />
			</li>
		</List>
	</teleport>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.side-menu {
	position: absolute; // assumes our teleport target is positioned
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
	pointer-events: auto; // assumes our teleport target has pointer-events: none;

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
