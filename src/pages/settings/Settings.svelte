<script lang="ts">
	import ChangePasswordForm from "./ChangePasswordForm.svelte";
	import ChangeAccountIdForm from "./ChangeAccountIdForm.svelte";
	import DeleteData from "./DeleteData.svelte";
	import Exports from "./Exports.svelte";
	import Import from "./Import.svelte";
	import LocationPrefForm from "./LocationPrefForm.svelte";
</script>

<main class="content">
	<div class="heading">
		<!-- TODO: I18N -->
		<h1>Settings</h1>
	</div>

	<LocationPrefForm />
	<ChangeAccountIdForm />
	<ChangePasswordForm />
	<Import />
	<Exports />
	<DeleteData />
</main>

<style lang="scss">
	.heading {
		max-width: 36em;
		margin: 1em auto;

		> h1 {
			margin: 0;
		}
	}
</style>
