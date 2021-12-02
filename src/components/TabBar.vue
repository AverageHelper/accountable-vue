<script setup lang="ts">
import type { Tab } from "../model/ui/tabs";
import TabItem from "./TabItem.vue";
import { isTab, allTabs } from "../model/ui/tabs";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = computed(() => allTabs);
const currentTab = computed<Tab | null>(() => {
	const t: string | undefined = route.path
		.split("/") // split path by delimiters
		.find(s => s !== ""); // get first nonempty path segment

	if (t === undefined || !isTab(t)) return null;

	return t;
});
</script>

<template>
	<nav>
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
}
</style>
