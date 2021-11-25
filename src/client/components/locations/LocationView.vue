<script setup lang="ts">
import type { Location } from "../../model/Location";
import type { PropType } from "vue";

defineProps({
	location: { type: Object as PropType<Location>, required: true },
});
</script>

<template>
	<p>{{ location.title }}</p>
	<p>{{ location.subtitle }}</p>
	<p>{{ location.lastUsed }}</p>
	<p>{{ location.coordinate }}</p>
</template>
