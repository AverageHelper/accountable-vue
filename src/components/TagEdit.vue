<script setup lang="ts">
import type { PropType } from "vue";
import type { TagRecordParams } from "../model/Tag";
import type { ColorID } from "../model/Color";
import ActionButton from "./ActionButton.vue";
import ColorPicker from "./ColorPicker.vue";
import TextField from "./TextField.vue";
import { ref, computed, toRefs } from "vue";

const emit = defineEmits(["finished"]);

const props = defineProps({
	params: { type: Object as PropType<TagRecordParams | null>, default: null },
});
const { params } = toRefs(props);

const nameField = ref<HTMLInputElement | null>(null);
const name = ref("");
const colorId = ref<ColorID>("blue");

const isCreatingTag = computed(() => params.value === null);
const canSave = computed(() => name.value !== "");

function save() {
	const newTagParams: TagRecordParams = {
		name: name.value.trim(),
		colorId: colorId.value,
	};
	emit("finished", newTagParams);
}

function focus() {
	nameField.value?.focus();
}

defineExpose({ focus });
</script>

<template>
	<form @submit.prevent="save">
		<TextField
			ref="nameField"
			v-model="name"
			label="Name"
			:placeholder="params?.name ?? 'hashtag'"
		/>
		<ColorPicker v-model="colorId" />

		<ActionButton type="submit" kind="bordered-primary" :disabled="!canSave">
			<span v-if="isCreatingTag">
				Create <span v-if="name">&quot;{{ name.trim() }}&quot;</span>
				<span v-else>Tag</span>
			</span>
			<span v-else>Save</span>
		</ActionButton>
	</form>
</template>
