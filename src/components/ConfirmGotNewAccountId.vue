<script setup lang="ts">
import ActionButton from "./buttons/ActionButton.vue";
import Confirm from "./Confirm.vue";
import { computed } from "vue";
import { useAuthStore } from "../store";

const emit = defineEmits(["yes", "no"]);

defineProps({
	isOpen: { type: Boolean, required: true },
});

const auth = useAuthStore();

const accountId = computed(() => auth.accountId);

function no() {
	emit("no");
}

function yes() {
	emit("yes");
}
</script>

<template>
	<Confirm :is-open="isOpen" :close-modal="no">
		<!-- TODO: I18N -->
		<template #message
			>Do you have your account ID (<code>{{ accountId }}</code
			>) written down somewhere safe?</template
		>

		<template #primary-action>
			<ActionButton kind="bordered-primary" @click="yes">Yes</ActionButton>
		</template>
		<template #cancel-action>
			<ActionButton kind="bordered-secondary" @click="no">Not yet</ActionButton>
		</template>
	</Confirm>
</template>
