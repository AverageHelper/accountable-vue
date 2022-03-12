<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ActionButton from "./buttons/ActionButton.vue";
import SearchIcon from "../icons/Search.vue";
import TextField from "./inputs/TextField.vue";

const route = useRoute();
const router = useRouter();

const initialSearchQuery = computed(() => (route.query["q"] ?? "").toString());

const searchQuery = ref(initialSearchQuery.value.trim());
const needsCommitSearch = computed(
	() => searchQuery.value.trim() !== initialSearchQuery.value.trim()
);

function commit() {
	const q = searchQuery.value.trim();
	const query = q ? { q } : {};

	void router.replace({ path: route.path, query });
}
</script>

<template>
	<div class="search">
		<TextField
			v-model="searchQuery"
			type="search"
			placeholder="Search"
			class="input"
			@keyup.enter="commit"
		/>
		<ActionButton v-show="needsCommitSearch" kind="bordered-primary" @click.prevent="commit">
			<SearchIcon />
		</ActionButton>
	</div>
</template>

<style scoped lang="scss">
.search {
	display: flex;
	flex-flow: row nowrap;

	> * {
		margin: 8pt 0;
	}

	> .input {
		flex-grow: 1;
	}

	> *:not(:first-child) {
		margin-left: 8pt;
	}
}
</style>
