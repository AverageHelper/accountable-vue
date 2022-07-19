<script lang="ts">
	import { useTagsStore } from "../../store";
	import List from "../../components/List.svelte";
	import Tag from "./Tag.svelte";

	const tags = useTagsStore();

	$: allTags = tags.allTags;
	$: numberOfTags = allTags.length;
</script>

<main class="content">
	<div class="heading">
		<!-- TODO: I18N -->
		<h1>Tags</h1>
		<p>To add a tag, go to one of your transactions.</p>
	</div>

	<List>
		{#each allTags as tag (tag.id)}
			<li>
				<Tag {tag} showsCount={true} />
				<!-- <ConfirmDestroyTag
					{tag}
					isOpen={tagIdToDestroy === tag.id}
					on:yes={confirmDeleteTag}
					on:no={cancelDeleteTag}
				/> -->
			</li>
		{/each}
		{#if numberOfTags > 0}
			<li>
				<p class="footer"
					>{numberOfTags} tag{#if numberOfTags !== 1}<span>s</span>{/if}</p
				>
			</li>
		{/if}
	</List>
</main>

<style type="text/scss">
	@use "styles/colors" as *;

	.heading {
		max-width: 36em;
		margin: 1em auto;

		> h1 {
			margin: 0;
		}
	}

	.footer {
		color: color($secondary-label);
		user-select: none;
	}
</style>
