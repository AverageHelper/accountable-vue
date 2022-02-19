<script setup lang="ts">
import type { Component } from "vue";
import ActionButton from "./ActionButton.vue";
import AppVersion from "./AppVersion.vue";
import Gear from "../icons/Gear.vue";
import List from "./List.vue";
import LogOut from "../icons/LogOut.vue";
import MenuIcon from "../icons/Menu.vue";
import DiskUsage from "./user/DiskUsage.vue";
import { ref, computed } from "vue";
import { useAuthStore } from "../store";

export interface MenuItem {
	id: string;
	name: string;
	path: string;
	requiresLogin?: boolean;
	icon?: Component;
}

const auth = useAuthStore();

const isMenuOpen = ref(false);
const isLoggedIn = computed(() => auth.uid !== null);
const hasItems = computed(() => isLoggedIn.value);

const settingsItems = computed<Array<MenuItem>>(() => [
	{ id: "settings", name: "Settings", path: "/settings", requiresLogin: true, icon: Gear },
	{ id: "log-out", name: "Log out", path: "/logout", requiresLogin: true, icon: LogOut },
]);

function close() {
	isMenuOpen.value = false;
}
</script>

<template>
	<ActionButton v-if="hasItems" @click="isMenuOpen = !isMenuOpen">
		<MenuIcon />
	</ActionButton>

	<teleport to="body">
		<div v-if="isMenuOpen" class="side-menu__backdrop" @click="close" />
		<List v-show="isMenuOpen" class="side-menu">
			<template v-for="item in settingsItems" :key="item.id">
				<li v-if="!item.requiresLogin || isLoggedIn">
					<router-link :to="item.path" @click="close">
						<component :is="item.icon" v-if="item.icon" />
						<span>{{ item.name }}</span>
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
	text-align: right;
	margin: 0.5em;
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
