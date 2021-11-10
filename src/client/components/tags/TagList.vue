<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
import Modal from "../Modal.vue";
import Tag from "./Tag.vue";
import TagEdit from "./TagEdit.vue";
import { ref, computed, nextTick } from "vue";

const emit = defineEmits(["create-tag", "modify-tag", "remove-tag"]);

defineProps({
	tagIds: { type: Array as PropType<ReadonlyArray<string>>, required: true },
});

const tagEdit = ref<{ focus: () => void } | null>(null);
const isCreatingTag = ref(false);
const tagToEdit = ref<TagObject | null>(null);
const isEditingTag = computed(() => tagToEdit.value !== null);
const isModalOpen = computed(() => isCreatingTag.value || isEditingTag.value);

async function addTag() {
	isCreatingTag.value = true;
	await nextTick(); // wait to focus until the element is attached
	tagEdit.value?.focus();
}

function removeTag(tag: TagObject) {
	emit("remove-tag", tag);
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
		<ul v-if="tagIds.length > 0" class="tags">
			<li v-for="tagId in tagIds" :key="tagId">
				<Tag :tag-id="tagId" :on-remove="removeTag" />
			</li>
		</ul>
		<p v-else class="empty">No tags</p>

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
