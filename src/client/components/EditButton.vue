<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import EditIcon from "../icons/Edit.vue";
import Modal from "./Modal.vue";
import { ref } from "vue";

defineProps({
	disabled: { type: Boolean, default: false },
});

const isOpen = ref(false);

function closeModal() {
	isOpen.value = false;
}
</script>

<template>
	<ActionButton :disabled="disabled" @click="isOpen = !isOpen">
		<slot name="icon">
			<EditIcon class="icon" />
		</slot>
	</ActionButton>

	<Modal :open="isOpen" :close-modal="closeModal">
		<slot name="modal" :on-finished="closeModal" />
	</Modal>
</template>

<style scoped lang="scss">
.icon {
	position: relative;
	top: -2pt;
	width: 20pt;
	height: 20pt;
}
</style>
