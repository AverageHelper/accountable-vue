<script setup lang="ts">
import List from "./List.vue";
import Menu from "../icons/Menu.vue";
import PlainButton from "./PlainButton.vue";
import { ref, computed } from "vue";
import { useAuthStore } from "../store/authStore";

const auth = useAuthStore();

const isMenuOpen = ref(false);
const isLoggedIn = computed(() => auth.uid !== null);
const hasItems = computed(() => isLoggedIn.value);

function close() {
	isMenuOpen.value = false;
}
</script>

<template>
	<PlainButton v-if="hasItems" @click="isMenuOpen = !isMenuOpen">
		<Menu />
	</PlainButton>

	<teleport to="body">
		<div v-if="isMenuOpen" class="side-menu__backdrop" @click="close" />
		<List v-show="isMenuOpen" class="side-menu">
			<li v-if="isLoggedIn">
				<router-link to="/logout" @click="close">Log out</router-link>
			</li>
		</List>
	</teleport>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.side-menu {
	position: absolute; // assumes our teleport target is positioned
	top: 5em;
	right: 0;
	background-color: color($secondary-fill);
	width: 100vw;
	max-width: 180pt;
	text-align: right;
	padding: 0.5em;
	pointer-events: auto; // assumes our teleport target has pointer-events: none;

	&__backdrop {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: color($transparent-gray);
	}
}
</style>
