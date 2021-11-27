<script setup lang="ts">
import type { Location } from "../../model/Location";
import type { PropType } from "vue";
import LocationIcon from "../../icons/Location.vue";
import TextIcon from "../../icons/Text.vue";

defineProps({
	location: { type: Object as PropType<Location>, required: true },
});
</script>

<template>
	<div class="location">
		<LocationIcon v-if="location.coordinate" />
		<TextIcon v-else />
		<span>{{ location.title }}</span>
	</div>
</template>

<stype scoped lang="scss">
@use "styles/colors" as *;

.location {
	background-color: color($secondary-fill);
	padding: 4pt;
	cursor: pointer;

	@media (hover: hover) {
		&:hover {
			background-color: color($fill);
		}
	}

	.icon {
		margin-right: 4pt;
	}
}
</stype>
