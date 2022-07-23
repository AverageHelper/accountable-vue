<script lang="ts">
	import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
	import { allTags } from "../../store";
	import { createEventDispatcher, tick } from "svelte";
	import { tag as newTag } from "../../model/Tag";
	import Modal from "../../components/Modal.svelte";
	import NopLink from "../../components/NopLink.svelte";
	import Tag from "./Tag.svelte";
	import TagEdit from "./TagEdit.svelte";

	const dispatch = createEventDispatcher<{
		"create-tag": TagRecordParams;
		"modify-tag": TagObject;
		"remove-tag": TagObject;
	}>();

	export let tagIds: Array<string>;

	let tagEdit: TagEdit | undefined;
	let isCreatingTag = false;
	let tagToEdit: TagObject | null = null;
	$: isEditingTag = tagToEdit !== null;
	$: isModalOpen = isCreatingTag || isEditingTag;

	$: referencedTags = $allTags
		.filter(tag => tagIds.includes(tag.id))
		.sort((a, b) => a.name.localeCompare(b.name));

	async function addTag() {
		isCreatingTag = true;
		await tick(); // wait to focus until the element is attached
		tagEdit?.focus();
	}

	function removeTag(tag: TagObject) {
		dispatch("remove-tag", tag);
	}

	function closeModal() {
		isCreatingTag = false;
		tagToEdit = null;
	}

	function commitTag(params: CustomEvent<TagRecordParams | null>) {
		if (params.detail === null) {
			// nop
		} else if (isCreatingTag) {
			dispatch("create-tag", params.detail);
		} else if (tagToEdit) {
			const updatedTag = newTag({ ...tagToEdit, ...params.detail });
			dispatch("modify-tag", updatedTag);
		}
		closeModal();
	}

	function useTag(tag: CustomEvent<TagObject>) {
		dispatch("create-tag", tag.detail); // The parent worries about preventing duplicates
		closeModal();
	}
</script>

<div class="tag-list-e076a556">
	<ul class="tags">
		{#each referencedTags as tag (tag.id)}
			<li>
				<Tag {tag} onRemove={removeTag} />
			</li>
		{/each}
		<li>
			<!-- TODO: I18N -->
			<NopLink on:click={addTag}>Add tag</NopLink>
		</li>
	</ul>
</div>

<Modal open={isModalOpen} {closeModal}>
	<TagEdit bind:this={tagEdit} on:selected={useTag} on:finished={commitTag} />
</Modal>

<style lang="scss" global>
	@use "styles/colors" as *;

	.tag-list-e076a556 {
		display: flex;
		flex-flow: row wrap;
		align-items: baseline;

		ul.tags {
			display: flex;
			flex-flow: row wrap;
			list-style: none;
			padding: 0;
			max-width: 36em;
			margin: 0;
		}

		a {
			white-space: nowrap;
		}
	}
</style>
