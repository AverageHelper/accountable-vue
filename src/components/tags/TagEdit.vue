<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
import type { ColorID } from "../../model/Color";
import ActionButton from "../buttons/ActionButton.vue";
import ColorPicker from "../inputs/ColorPicker.vue";
import ConfirmDestroyTag from "./ConfirmDestroyTag.vue";
import List from "../List.vue";
import Tag from "./Tag.vue";
import TextField from "../inputs/TextField.vue";
import { ref, computed, toRefs } from "vue";
import { useTagsStore, useTransactionsStore } from "../../store";

const emit = defineEmits(["selected", "finished"]);

const props = defineProps({
	params: { type: Object as PropType<TagRecordParams | null>, default: null },
});
const { params } = toRefs(props);

const transactions = useTransactionsStore();
const tags = useTagsStore();

const nameField = ref<HTMLInputElement | null>(null);
const name = ref("");
const colorId = ref<ColorID>("blue");
const tagIdToDestroy = ref<string | null>(null);

const isCreatingTag = computed(() => params.value === null);
const canSave = computed(() => name.value !== "");
const allTags = computed(() =>
	tags.allTags //
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name))
);

function save() {
	const newTagParams: TagRecordParams = {
		name: name.value.trim(),
		colorId: colorId.value,
	};
	emit("finished", newTagParams);
}

function useTag(tag: TagObject) {
	emit("selected", tag);
}

function askDeleteTag(tag: TagObject) {
	tagIdToDestroy.value = tag.id;
}

function cancelDeleteTag() {
	tagIdToDestroy.value = null;
}

async function confirmDeleteTag(tag: TagObject) {
	tagIdToDestroy.value = null;
	await transactions.removeTagFromAllTransactions(tag);
	await tags.deleteTag(tag);
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

	<List>
		<li v-for="tag in allTags" :key="tag.id">
			<Tag :tag="tag" :shows-count="true" :on-select="useTag" :on-remove="askDeleteTag" />
			<ConfirmDestroyTag
				:tag="tag"
				:is-open="tagIdToDestroy === tag.id"
				@yes="confirmDeleteTag"
				@no="cancelDeleteTag"
			/>
		</li>
	</List>
</template>

<style scoped lang="scss">
form {
	align-items: center;
}
</style>
