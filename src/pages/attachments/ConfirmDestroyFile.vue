<script setup lang="ts">
import type { PropType } from "vue";
import type { Attachment } from "../../model/Attachment";
import ActionButton from "../../components/buttons/ActionButton.vue";
import Confirm from "../../components/Confirm.vue";
import { toRefs } from "vue";

const emit = defineEmits(["yes", "no"]);

const props = defineProps({
	file: { type: Object as PropType<Attachment | null>, default: null },
	isOpen: { type: Boolean, required: true },
});
const { file } = toRefs(props);

function no() {
	if (file.value) {
		emit("no", file.value);
	}
}

function yes() {
	if (file.value) {
		emit("yes", file.value);
	}
}
</script>

<template>
	<Confirm :is-open="isOpen" :close-modal="no">
		<!-- TODO: I18N -->
		<template #message
			>Are you sure you want to delete <strong v-if="file">{{ file.title }}</strong
			><span v-else>this file</span>? This cannot be undone.</template
		>

		<template #primary-action>
			<ActionButton kind="bordered-destructive" @click="yes">Yes</ActionButton>
		</template>
		<template #secondary-action>
			<ActionButton kind="bordered-primary" @click="no">No</ActionButton>
		</template>
	</Confirm>
</template>
