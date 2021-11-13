<script setup lang="ts">
import ChangePasswordForm from "./ChangePasswordForm.vue";
import ChangeEmailForm from "./ChangeEmailForm.vue";
import LocationPrefForm from "./LocationPrefForm.vue";
</script>

<template>
	<div class="heading">
		<h1>Settings</h1>
	</div>

	<ChangeEmailForm />
	<ChangePasswordForm />
	<LocationPrefForm v-if="false" />
</template>

<style scoped lang="scss">
.heading {
	max-width: 36em;
	margin: 1em auto;

	> h1 {
		margin: 0;
	}
}
</style>
