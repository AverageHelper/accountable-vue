<script setup lang="ts">
import { useUiStore } from "../store";
import { computed, onMounted } from "vue";
import { version as _clientVersion } from "../version";
import OutLink from "./OutLink.vue";

const ui = useUiStore();

const serverVersion = computed(() => ui.serverVersion);
const loadingError = computed(() => ui.serverLoadingError);
const isLoading = computed(
	() => serverVersion.value === "loading" || typeof serverVersion.value !== "string"
);

onMounted(() => {
	void ui.loadServerVersion();
});

const clientVersion = computed(() => _clientVersion);
const repositoryUrl = computed(
	() => `https://github.com/AverageHelper/accountable-vue/tree/v${clientVersion.value}`
);
</script>

<template>
	<OutLink :to="repositoryUrl"
		>Accountable Client v{{ clientVersion }}, Server
		<span v-if="isLoading" :title="loadingError ? loadingError.message : undefined">vX.X.X</span>
		<span v-else>v{{ serverVersion }}</span>
	</OutLink>
</template>
