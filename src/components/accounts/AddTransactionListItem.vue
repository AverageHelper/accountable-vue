<script setup lang="ts">
import ListItem from "../ListItem.vue";
import PlusWithCircle from "../../icons/PlusWithCircle.vue";

const emit = defineEmits(["click"]);

function onClick() {
	emit("click");
}
</script>

<template>
	<ListItem class="add" title="Add a record" to="" @click.prevent="onClick">
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
	margin-right: 11pt;
	margin-left: 4pt;
	color: color($green);
}
</style>
