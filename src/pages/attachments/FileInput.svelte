<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let accept: string = "image/*";
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		input: File | null;
	}>();

	let inputElement: HTMLInputElement | undefined;

	function onFileChanged(event: Event) {
		const input = event.target as HTMLInputElement | null;
		if (!input) return;

		const file = input.files?.item(0) ?? null;
		dispatch("input", file);

		input.files = null; // reset the file input, probably
	}

	function click() {
		inputElement?.click();
	}
</script>

<label class="file-input">
	<input bind:this={inputElement} type="file" {accept} {disabled} on:change={onFileChanged} />
	<span>
		<!-- TODO: I18N -->
		<slot {click}>Choose a file</slot>
	</span>
</label>

<style lang="scss">
	@use "styles/colors" as *;

	.file-input {
		color: color($link);
		cursor: pointer;
		text-decoration: underline;

		> input {
			opacity: 0;
			width: 0.1px;
			height: 0.1px;
			position: absolute;
		}
	}
</style>
