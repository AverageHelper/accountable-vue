<script setup lang="ts">
import List from "../List.vue";
import Tag from "./Tag.vue";
import { computed } from "vue";
import { useTagsStore } from "../../store";

const tags = useTagsStore();

const allTags = computed(() => tags.allTags);
const numberOfTags = computed(() => allTags.value.length);
</script>

<template>
	<p>To add a tag, go to one of your transactions.</p>

	<List>
		<li v-for="tag in allTags" :key="tag.id">
			<Tag :tag-id="tag.id" :shows-count="true" />
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
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

p {
	text-align: center;
}

.footer {
	color: color($secondary-label);
	user-select: none;
}
</style>
