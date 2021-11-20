<script setup lang="ts">
import ChangePasswordForm from "./ChangePasswordForm.vue";
import ChangeEmailForm from "./ChangeEmailForm.vue";
import Exports from "./Exports.vue";
import Import from "./Import.vue";
import LocationPrefForm from "./LocationPrefForm.vue";
</script>

<template>
	<div class="heading">
		<h1>Settings</h1>
	</div>

	<LocationPrefForm />
	<ChangeEmailForm />
	<ChangePasswordForm />
	<Import />
	<Exports />
	<!-- TODO: Delete all data -->
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
