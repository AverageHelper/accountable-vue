<script setup lang="ts">
import ChangePasswordForm from "./ChangePasswordForm.vue";
import ChangeAccountIdForm from "./ChangeAccountIdForm.vue";
import DeleteData from "./DeleteData.vue";
import Exports from "./Exports.vue";
import Import from "./Import.vue";
import LocationPrefForm from "./LocationPrefForm.vue";
</script>

<template>
	<div class="heading">
		<h1>Settings</h1>
	</div>

	<LocationPrefForm />
	<ChangeAccountIdForm />
	<ChangePasswordForm />
	<Import />
	<Exports />
	<DeleteData />
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
