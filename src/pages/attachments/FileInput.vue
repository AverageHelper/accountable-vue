<script setup lang="ts">
import { ref } from "vue";

defineProps({
	accept: { type: String, default: "image/*" },
	disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["input"]);

const inputElement = ref<HTMLInputElement | null>(null);

function onFileChanged(event: Event) {
	const input = event.target as HTMLInputElement | null;
	if (!input) return;

	const file = input.files?.item(0) ?? null;
	emit("input", file);

	input.files = null; // reset the file input, probably
}

function click() {
	inputElement.value?.click();
}
</script>

<template>
	<label class="file-input">
		<input
			ref="inputElement"
			type="file"
			:accept="accept"
			:disabled="disabled"
			@change="onFileChanged"
		/>
		<span>
			<slot :click="click">Choose a file</slot>
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
