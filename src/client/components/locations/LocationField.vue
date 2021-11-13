<script setup lang="ts">
import type { LocationRecordParams } from "../../model/Location";
import type { PropType } from "vue";
import ActionButton from "../ActionButton.vue";
import Checkmark from "../../icons/Checkmark.vue";
import TextField from "../TextField.vue";
import { computed, ref, toRefs, watch } from "vue";

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
	modelValue: {
		type: Object as PropType<(LocationRecordParams & { id: string | null }) | null>,
		default: null,
	},
});
const { modelValue } = toRefs(props);

const title = ref("");
const selectedLocationId = ref<string | null>(null);
const hasChanged = computed(() => {
	return title.value.trim() !== (modelValue.value?.title.trim() ?? "");
});

watch(
	modelValue,
	modelValue => {
		title.value = modelValue?.title ?? "";
		selectedLocationId.value = modelValue?.id ?? null;
	},
	{ immediate: true }
);

function submit() {
	const newTitle = title.value.trim();

	if (!newTitle) {
		emit("update:modelValue", null);
		return;
	}

	const data: LocationRecordParams & { id: string | null } = {
		id: selectedLocationId.value,
		title: newTitle,
		subtitle: null,
		coordinate: null,
		lastUsed: new Date(),
	};
	emit("update:modelValue", data);
}
</script>

<template>
	<label class="container">
		<TextField
			v-model="title"
			class="title-field"
			label="location"
			placeholder="Swahilli, New Guinnea"
			@keyup.enter="submit"
		/>
		<ActionButton v-if="hasChanged" class="finish" kind="bordered-primary" @click.prevent="submit">
			<Checkmark />
		</ActionButton>

		<!-- Dropdown for recent locations -->
	</label>
</template>

<style scoped lang="scss">
.container {
	display: flex;
	flex-flow: row nowrap;

	.title-field {
		width: 100%;
	}
}
</style>
