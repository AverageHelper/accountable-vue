<script lang="ts">
	import Modal from "./Modal.svelte";

	export let message: string = "Confirm?";
	export let isOpen: boolean;
	export let closeModal: () => void;
</script>

<Modal open={isOpen} {closeModal}>
	<p>
		<slot name="message">{message}</slot>
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

<style lang="scss">
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
