<script lang="ts">
	import ActionButton from "./ActionButton.svelte";
	import EditIcon from "../../icons/Edit.svelte";
	import Modal from "../Modal.svelte";

	export let disabled: boolean = false;

	let isOpen = false;

	function closeModal() {
		isOpen = false;
	}

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<ActionButton class="edit-button-13639ef4" {disabled} on:click={toggle}>
	<slot name="icon">
		<EditIcon class="icon" />
	</slot>
</ActionButton>

<Modal open={isOpen} {closeModal}>
	<slot name="modal" onFinished={closeModal} />
</Modal>

<style lang="scss" global>
	.edit-button-13639ef4 {
		.icon {
			position: relative;
			top: -2pt;
			width: 20pt;
			height: 20pt;
		}
	}
</style>
