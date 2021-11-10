<script setup lang="ts">
import type { PropType } from "vue";
import type { Tab } from "../model/ui/tabs";

defineProps({
	tab: { type: String as PropType<Tab>, required: true },
	isSelected: { type: Boolean, default: false },
});
</script>

<template>
	<div class="item-container" :class="{ selected: isSelected }">
		<router-link v-if="tab === 'accounts'" to="/accounts">Accounts</router-link>
		<router-link v-else-if="tab === 'tags'" to="/tags">Tags</router-link>
		<router-link v-else-if="tab === 'attachments'" to="/attachments">Files</router-link>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.item-container {
	display: flex;
	align-items: center;
	min-height: 3em;
	height: 100%;

	a {
		height: 100%;
		padding: 0 1em;
		line-height: 3em;
		font-weight: bold;
		text-decoration: none;
	}

	&.selected {
		border-bottom: 2pt solid color($link);
	}

	@media (hover: hover) {
		&:hover {
			background: color($gray4);
		}
	}
}
</style>
