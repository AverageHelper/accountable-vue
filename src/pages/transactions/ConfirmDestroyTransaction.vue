<script setup lang="ts">
import type { PropType } from "vue";
import type { Transaction } from "../../model/Transaction";
import ActionButton from "../../components/buttons/ActionButton.vue";
import Confirm from "../../components/Confirm.vue";
import { toRefs } from "vue";

const emit = defineEmits(["yes", "no"]);

const props = defineProps({
	transaction: { type: Object as PropType<Transaction>, required: true },
	isOpen: { type: Boolean, required: true },
});
const { transaction } = toRefs(props);

function no() {
	emit("no", transaction.value);
}

function yes() {
	emit("yes", transaction.value);
}
</script>

<template>
	<Confirm :is-open="isOpen" :close-modal="no">
		<template #message
			>Are you sure you want to delete <strong>{{ transaction.title ?? "" }}</strong
			>? This cannot be undone.</template
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
