<script lang="ts">
	import type { ColorID } from "../../model/Color";
	import type { Tag as TagObject, TagRecordParams } from "../../model/Tag";
	import { createEventDispatcher } from "svelte";
	import { allTags as _allTags, deleteTag, removeTagFromAllTransactions } from "../../store";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Checkmark from "../../icons/Checkmark.svelte";
	import ColorPicker from "../../components/inputs/ColorPicker.svelte";
	import ConfirmDestroyTag from "./ConfirmDestroyTag.svelte";
	import Fuse from "fuse.js";
	import List from "../../components/List.svelte";
	import Tag from "./Tag.svelte";
	import TextField from "../../components/inputs/TextField.svelte";

	const dispatch = createEventDispatcher<{
		selected: TagObject;
		finished: TagRecordParams;
	}>();

	export let params: TagRecordParams | null = null;

	let nameField: TextField | undefined;
	let name = "";
	let colorId: ColorID = "blue";
	let tagIdToDestroy: string | null = null;

	$: canSave = name !== "";
	$: allTags = $_allTags //
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name));

	$: searchClient = new Fuse(allTags, { keys: ["name"] });

	$: filteredTags = name //
		? searchClient.search(name).map(r => r.item)
		: allTags;

	function save() {
		const newTagParams: TagRecordParams = {
			name: name.trim(),
			colorId,
		};
		dispatch("finished", newTagParams);
	}

	function useTag(tag: TagObject) {
		dispatch("selected", tag);
	}

	function askDeleteTag(tag: TagObject) {
		tagIdToDestroy = tag.id;
	}

	function cancelDeleteTag() {
		tagIdToDestroy = null;
	}

	async function confirmDeleteTag(tag: CustomEvent<TagObject>) {
		tagIdToDestroy = null;
		await removeTagFromAllTransactions(tag.detail);
		await deleteTag(tag.detail);
	}

	export function focus() {
		nameField?.focus();
	}
</script>

<!-- TODO: I18N -->
<h2>Choose a Tag</h2>
<form on:submit|preventDefault={save}>
	<div class="name-input">
		<TextField
			bind:this={nameField}
			bind:value={name}
			placeholder={params?.name ?? "new tag"}
			accentColor={name ? colorId : ""}
		/>
		{#if name}
			<ActionButton type="submit" kind="bordered-primary" disabled={!canSave}>
				<Checkmark />
			</ActionButton>
		{/if}
	</div>

	{#if name}
		<ColorPicker bind:value={colorId} />
	{/if}
</form>

<List>
	{#each filteredTags as tag (tag.id)}
		<li>
			<Tag {tag} showsCount={true} onSelect={useTag} onRemove={askDeleteTag} />
			<ConfirmDestroyTag
				{tag}
				isOpen={tagIdToDestroy === tag.id}
				on:yes={confirmDeleteTag}
				on:no={cancelDeleteTag}
			/>
		</li>
	{/each}
</List>

<style type="text/scss">
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
