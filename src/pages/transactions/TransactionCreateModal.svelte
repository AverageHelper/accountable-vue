<script lang="ts">
	import type { Account } from "../../model/Account";
	import Modal from "../../components/Modal.svelte";
	import TransactionEdit from "../transactions/TransactionEdit.svelte";

	export let account: Account;
	export let isOpen: boolean;
	export let closeModal: () => void;
</script>

<Modal open={isOpen} {closeModal}>
	<TransactionEdit {account} on:finished={closeModal} />
</Modal>
