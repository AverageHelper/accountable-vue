<script setup lang="ts">
import { Account } from "../model/Account";

defineProps({
	account: { type: Account, required: true },
});
</script>

<template>
	<div class="account-list-item">
		<span class="title">{{ account.title }}</span>
	</div>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

.account-list-item {
	padding: 0.75em 0.5em;
	margin-bottom: 0.5em;
	background-color: color($cloud);

	.title {
		font-weight: bold;
	}
}
</style>
