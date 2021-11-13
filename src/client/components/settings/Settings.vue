<script setup lang="ts">
import ChangePasswordForm from "./ChangePasswordForm.vue";
import ChangeEmailForm from "./ChangeEmailForm.vue";
</script>

<template>
	<div class="heading">
		<h1>Settings</h1>
	</div>

	<ChangePasswordForm />
	<ChangeEmailForm />
	<!-- Form to change location preferences: none, imprecise, precise -->
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
