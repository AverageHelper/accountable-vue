<script setup lang="ts">
import type { PropType } from "vue";
import type { Tab } from "../model/ui/tabs";
import { labelIdForTab, routeForTab } from "../model/ui/tabs";
import { computed, toRefs } from "vue";

const props = defineProps({
	tab: { type: String as PropType<Tab>, required: true },
	isSelected: { type: Boolean, default: false },
});
const { tab } = toRefs(props);

const to = computed(() => routeForTab(tab.value));
const labelId = computed(() => labelIdForTab(tab.value));
</script>

<template>
	<nuxt-link class="item-container" :class="{ selected: isSelected }" :to="to">{{
		$t(labelId)
	}}</nuxt-link>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.item-container {
	display: flex;
	align-items: center;
	min-height: 3em;
	height: 100%;
	padding: 0 1em;
	font-weight: bold;
	text-decoration: none;

	&.selected {
		border-bottom: 2pt solid color($link);
	}

	@media (hover: hover) {
		&:hover {
			background: color($gray4);
			text-decoration: none;
		}
	}
}
</style>
