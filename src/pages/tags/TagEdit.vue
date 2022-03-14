<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
import type { ColorID } from "../../model/Color";
import ActionButton from "../../components/buttons/ActionButton.vue";
import Checkmark from "../../icons/Checkmark.vue";
import ColorPicker from "../../components/inputs/ColorPicker.vue";
import ConfirmDestroyTag from "./ConfirmDestroyTag.vue";
import Fuse from "fuse.js";
import List from "../../components/List.vue";
import Tag from "./Tag.vue";
import TextField from "../../components/inputs/TextField.vue";
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

const canSave = computed(() => name.value !== "");
const allTags = computed(() =>
	tags.allTags //
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name))
);

const searchClient = computed(
	() => new Fuse(allTags.value, { keys: ["name"] }) //
);
const filteredTags = computed<Array<TagObject>>(() => {
	if (name.value) {
		return searchClient.value.search(name.value).map(r => r.item);
	}
	return allTags.value;
});

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
	<h2>Choose a Tag</h2>
	<form @submit.prevent="save">
		<div class="name-input">
			<TextField
				ref="nameField"
				v-model="name"
				:placeholder="params?.name ?? 'new tag'"
				:accent-color="name ? colorId : ''"
			/>
			<ActionButton v-show="name" type="submit" kind="bordered-primary" :disabled="!canSave">
				<Checkmark />
			</ActionButton>
		</div>

		<ColorPicker v-show="name" v-model="colorId" />
	</form>

	<List>
		<li v-for="tag in filteredTags" :key="tag.id">
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
@use "styles/colors" as *;

.name-input {
	display: flex;
	flex-flow: row nowrap;

	> label {
		flex-grow: 1;
	}

	> button {
		margin-left: 8pt;
		margin-top: 4pt;
	}
}
</style>
