<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag } from "../../model/Tag";
import ActionButton from "../ActionButton.vue";
import Confirm from "../Confirm.vue";
import { computed, toRefs } from "vue";
import { useTransactionsStore } from "../../store";

const emit = defineEmits(["yes", "no"]);

const props = defineProps({
	tag: { type: Object as PropType<Tag>, required: true },
	isOpen: { type: Boolean, required: true },
});
const { tag } = toRefs(props);

const transactions = useTransactionsStore();

const count = computed(() => transactions.numberOfReferencesForTag(tag.value.id));

function no() {
	emit("no", tag.value);
}

function yes() {
	emit("yes", tag.value);
}
</script>

<template>
	<Confirm :is-open="isOpen" :close-modal="no">
		<template #message
			>Are you sure you want to delete the tag <strong class="tag-name">{{ tag.name }}</strong
			>?<template v-if="count > 0">
				This tag will be removed from
				<strong>{{ count }} transaction(s)</strong>.</template
			>
			This cannot be undone.</template
		>

		<template #primary-action>
			<ActionButton kind="bordered-destructive" @click="yes">Yes</ActionButton>
		</template>
		<template #secondary-action>
			<ActionButton kind="bordered-primary" @click="no">No</ActionButton>
		</template>
		<!-- <template #cancel-action>
			<ActionButton kind="bordered-secondary" @click="no">Cancel</ActionButton>
		</template> -->
	</Confirm>
</template>

<style scoped lang="scss">
.tag-name {
	&::before {
		content: "#";
	}
}
</style>
