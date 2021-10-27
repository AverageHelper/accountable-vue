<script setup lang="ts">
import type { PropType } from "vue";
import type { TagRecordParams } from "../model/Tag";
import Modal from "./Modal.vue";
import Tag from "./Tag.vue";
import TagEdit from "./TagEdit.vue";
import { ref, computed, toRefs, nextTick } from "vue";
import { Tag as TagObject } from "../model/Tag";
import { useTagsStore } from "../store";

const emit = defineEmits(["create-tag", "modify-tag"]);

const props = defineProps({
	tagIds: { type: Array as PropType<ReadonlyArray<string>>, required: true },
});
const { tagIds } = toRefs(props);

const tags = useTagsStore();
const theseTags = computed(() =>
	(tagIds.value ?? []).map(id => tags.items[id] ?? new TagObject(id, { name: id, colorId: "red" }))
);

const tagEdit = ref<{ focus: () => void } | null>(null);
const isCreatingTag = ref(false);
const tagToEdit = ref<TagObject | null>(null);
const isEditingTag = computed(() => tagToEdit.value !== null);
const isModalOpen = computed(() => isCreatingTag.value || isEditingTag.value);

async function addTag() {
	isCreatingTag.value = true;
	await nextTick();
	tagEdit.value?.focus();
}

function closeModal() {
	isCreatingTag.value = false;
	tagToEdit.value = null;
}

function commitTag(params: TagRecordParams | null) {
	if (params === null) {
		// nop
	} else if (isCreatingTag.value) {
		emit("create-tag", params);
	} else if (tagToEdit.value) {
		const updatedTag = tagToEdit.value.updatedWith(params);
		emit("modify-tag", updatedTag);
	}
	closeModal();
}
</script>

<template>
	<div class="tag-list">
		<ul v-if="theseTags.length > 0" class="tags">
			<li v-for="tag in theseTags" :key="tag.id">
				<Tag :tag="tag" />
			</li>
		</ul>
		<a href="#" @click.prevent="addTag">Add tag</a>
	</div>

	<Modal :open="isModalOpen" :close-modal="closeModal">
		<TagEdit ref="tagEdit" @finished="commitTag" />
	</Modal>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.tag-list {
	display: flex;
	flex-flow: row nowrap;
	justify-content: space-between;
	align-items: baseline;

	ul.tags {
		display: flex;
		flex-flow: row wrap;
		list-style: none;
		padding: 0;
		max-width: 36em;

		li.new {
			display: flex;
			flex-flow: row nowrap;

			a {
				margin-left: 0.25em;
			}
		}
	}

	p.empty {
		color: color($secondary-label);
		text-align: left;
		margin-top: 0.5em;
		font-style: italic;
		font-weight: normal;
	}

	a {
		font-weight: bold;
		white-space: nowrap;
	}
}
</style>
