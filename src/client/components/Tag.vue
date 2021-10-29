<script setup lang="ts">
import type { PropType } from "vue";
import type { Tag } from "../model/Tag";
import TinyButton from "./TinyButton.vue";
import { computed, toRefs } from "vue";
import { useTagsStore, useTransactionsStore } from "../store";

const props = defineProps({
	tagId: { type: String, required: true },
	showsCount: { type: Boolean, default: false },
	onRemove: { type: Function as unknown as PropType<((tag: Tag) => void) | null>, default: null },
});
const { tagId } = toRefs(props);

const transactions = useTransactionsStore();
const tags = useTagsStore();

const tag = computed(() => tags.items[tagId.value] as Tag | undefined);
const count = computed(() => transactions.numberOfReferencesForTag(tag.value?.id));
</script>

<template>
	<div :class="`tag tag--${tag?.colorId ?? 'unknown'}`">
		<span class="title">{{ tag?.name ?? tagId }}</span>

		<slot />

		<p v-if="showsCount" class="count">{{ count }}</p>
		<TinyButton v-if="onRemove" class="remove" @click="() => tag && onRemove && onRemove(tag)"
			>&times;</TinyButton
		>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.tag {
	display: flex;
	flex-flow: row nowrap;
	align-items: center;
	margin-right: 0.5em;
	margin-bottom: 0.4em;
	padding: 0 0.5em;
	padding-right: 0.4em; // right wall was too thick for the round button
	color: color($label-dark);
	border-radius: 1em;
	min-width: min-content;
	text-align: left;
	font-weight: bold;
	cursor: default;

	&::before {
		content: "#";
	}

	.title {
		margin-right: 0.25em;
	}

	.count {
		margin: 0.2em 0;
		margin-left: auto;
		padding: 0 0.4em;
		min-width: 1.5em;
		border-radius: 1em;
		text-align: center;
		background-color: color($transparent-gray);
	}

	.remove {
		margin-left: 0.2em;
		display: none; // hide until hover
	}

	@media (hover: hover) {
		&:hover {
			.remove {
				display: inline-block; // back to default while hover
			}
		}
	}

	&--red {
		background-color: color($red);
	}
	&--orange {
		background-color: color($orange);
		color: color($label-light);
	}
	&--yellow {
		background-color: color($yellow);
		color: color($label-light);
	}
	&--green {
		background-color: color($green);
	}
	&--blue {
		background-color: color($blue);
	}
	&--purple {
		background-color: color($purple);
	}
}
</style>
