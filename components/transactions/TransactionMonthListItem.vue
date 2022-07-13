<script setup lang="ts">
import ListItem from "../../components/ListItem.vue";
import MonthIcon from "../../icons/Month.vue";
import { computed, toRefs } from "vue";
import { transactionsByMonth } from "../../router";

const props = defineProps({
	accountId: { type: String, required: true },
	monthName: { type: String, required: true },
	count: { type: Number, required: true },
});
const { accountId, monthName, count } = toRefs(props);

const monthRoute = computed(() => {
	const month = monthName.value;
	const encodedMonth = encodeURIComponent(month);
	return transactionsByMonth(accountId.value, encodedMonth);
});
</script>

<template>
	<!-- TODO: I18N -->
	<ListItem :to="monthRoute" :title="monthName" :subtitle="`${count} transactions`">
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
