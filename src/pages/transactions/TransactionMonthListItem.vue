<script setup lang="ts">
import ListItem from "../../components/ListItem.vue";
import MonthIcon from "../../icons/Month.vue";
import { toRefs } from "vue";

const props = defineProps({
	monthName: { type: String, required: true },
	count: { type: Number, required: true },
});
const { monthName, count } = toRefs(props);
</script>

<template>
	<ListItem :title="monthName" :subtitle="`${count} transactions`">
		<template #icon>
			<MonthIcon />
		</template>
	</ListItem>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.icon {
	margin: 4pt;
}

.list-item {
	cursor: pointer;
}
</style>
