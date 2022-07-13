<script setup lang="ts">
import type { PropType } from "vue";
import Modal from "./Modal.vue";

defineProps({
	message: { type: String, default: "Confirm?" },
	isOpen: { type: Boolean, required: true },
	closeModal: { type: Function as PropType<() => void>, required: true },
});
</script>

<template>
	<Modal :open="isOpen" :close-modal="closeModal">
		<p>
			<slot name="message">{{ message }}</slot>
		</p>

		<div class="buttons">
			<div class="cancel">
				<slot name="cancel-action" />
			</div>

			<div class="secondary">
				<slot name="secondary-action" />
			</div>
			<div class="primary">
				<slot name="primary-action" />
			</div>
		</div>
	</Modal>
</template>

<style scoped lang="scss">
p {
	text-align: left;
}

.buttons {
	display: flex;
	flex-flow: row nowrap;

	.cancel {
		margin-right: auto;
	}

	.primary {
		margin-left: 0.7em;
	}
}
</style>
