<script setup lang="ts">
import { computed } from "vue";
import { useAccountsStore } from "../store";

const props = defineProps({
	accountId: { type: String, required: true },
});

const accounts = useAccountsStore();
const account = computed(() => accounts.items[props.accountId]);
</script>

<template>
	{{ account.id }}
	{{ account.title }}
</template>
