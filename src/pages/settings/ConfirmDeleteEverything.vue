<script setup lang="ts">
import ActionButton from "../../components/buttons/ActionButton.vue";
import Confirm from "../../components/Confirm.vue";

const emit = defineEmits(["yes", "no"]);

defineProps({
	isOpen: { type: Boolean, required: true },
});

function no() {
	emit("no");
}

function yes() {
	emit("yes");
}
</script>

<template>
	<Confirm :is-open="isOpen" :close-modal="no">
		<template #message
			>Are you sure you want to delete <strong>all of your data</strong>? This cannot be
			undone.</template
		>

		<template #primary-action>
			<ActionButton kind="bordered-destructive" @click="yes">Yes</ActionButton>
		</template>
		<template #secondary-action>
			<ActionButton kind="bordered-primary" @click="no">No</ActionButton>
		</template>
	</Confirm>
</template>
