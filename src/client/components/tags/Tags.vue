<script setup lang="ts">
import List from "../List.vue";
import Tag from "./Tag.vue";
import { computed } from "vue";
import { useTagsStore } from "../../store";

const tags = useTagsStore();

const allTags = computed(() => tags.allTags);
</script>

<template>
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
	</List>
</template>
