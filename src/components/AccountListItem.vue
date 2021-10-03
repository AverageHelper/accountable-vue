<script setup lang="ts">
import { Account } from "../model/Account";
import { computed } from "vue";

const props = defineProps({
	account: { type: Account, required: true },
});

const accountRoute = computed(() => `/accounts/${props.account.id}`);
</script>

<template>
	<router-link class="account-list-item" :to="accountRoute">
		<span class="title">{{ account.title }}</span>
	</router-link>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.account-list-item {
	display: block;
	padding: 0.75em 0.5em;
	margin-bottom: 0.5em;
	text-decoration: none;
	color: color($label);
	background-color: color($cloud);

	.title {
		font-weight: bold;
	}
}
</style>
