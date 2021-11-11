<script setup lang="ts">
const emit = defineEmits(["input"]);

function onFileChanged(event: Event) {
	const input = event.target as HTMLInputElement | null;
	if (!input) return;

	const file = input.files?.item(0) ?? null;
	emit("input", file);

	input.files = null; // reset the file input, probably
}
</script>

<template>
	<label class="file-input">
		<input type="file" accept="image/*" @change="onFileChanged" />
		<span>
			<slot>Choose a file</slot>
		</span>
	</label>
</template>

<style scoped lang="scss">
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
