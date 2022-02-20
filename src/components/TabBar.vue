<script setup lang="ts">
import type { Tab } from "../model/ui/tabs";
import TabItem from "./TabItem.vue";
import { isAppTab, appTabs } from "../model/ui/tabs";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = computed(() => appTabs);
const currentTab = computed<Tab | null>(() => {
	const t: string | undefined = route.path
		.split("/") // split path by delimiters
		.find(s => s !== ""); // get first nonempty path segment

	if (t === undefined || !isAppTab(t)) return null;

	return t;
});

const windowWidth = ref(window.innerWidth);
const tooSmall = computed(() => windowWidth.value < 768);

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
	<nav v-show="!tooSmall">
		<TabItem
			v-for="tab in tabs"
			:key="tab"
			class="item"
			:tab="tab"
			:is-selected="currentTab === tab"
		/>
	</nav>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

nav {
	background-color: color($navbar-background);
	display: flex;
	flex-flow: row nowrap;
	justify-content: center;
	align-items: center;
	overflow-y: scroll;
}
</style>
