<script setup lang="ts">
import ListItem from "../../components/ListItem.vue";
import PlusWithCircle from "../../icons/PlusWithCircle.vue";

const emit = defineEmits(["click"]);

defineProps({
	noun: { type: String, default: "record" },
});

function onClick() {
	emit("click");
}
</script>

<template>
	<!-- TODO: I18N -->
	<ListItem class="add" :title="`Add a new ${noun}`" to="" @click.prevent="onClick">
		<template #icon>
			<PlusWithCircle class="icon" />
		</template>
	</ListItem>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.add {
	color: color($green);
	min-height: 44pt;
}

.icon {
	margin-right: 7pt;
	margin-left: 4pt;
	color: color($green);
}
</style>
