<script setup lang="ts">
import List from "@/components/List.vue";
import Tag from "./Tag.vue";
import { computed } from "vue";
import { useTagsStore } from "@/store";

const tags = useTagsStore();

const allTags = computed(() => tags.allTags);
const numberOfTags = computed(() => allTags.value.length);
</script>

<template>
	<main class="content">
		<div class="heading">
			<!-- TODO: I18N -->
			<h1>Tags</h1>
			<p>To add a tag, go to one of your transactions.</p>
		</div>

		<List>
			<li v-for="tag in allTags" :key="tag.id">
				<Tag :tag="tag" :shows-count="true" />
				<!-- <ConfirmDestroyTag
				:tag="tag"
				:is-open="tagIdToDestroy === tag.id"
				@yes="confirmDeleteTag"
				@no="cancelDeleteTag"
			/> -->
			</li>
			<li v-if="numberOfTags > 0">
				<p class="footer">{{ numberOfTags }} tag<span v-if="numberOfTags !== 1">s</span></p>
			</li>
		</List>
	</main>
</template>

<style scoped lang="scss">
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
