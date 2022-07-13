<script setup lang="ts">
import type { PropType } from "vue";
import type { Account } from "../../model/Account";
import Modal from "../../components/Modal.vue";
import TransactionEdit from "../transactions/TransactionEdit.vue";

defineProps({
	account: { type: Object as PropType<Account>, required: true },
	isOpen: { type: Boolean, required: true },
	closeModal: { type: Function as PropType<() => void>, required: true },
});
</script>

<template>
	<Modal :open="isOpen" :close-modal="closeModal">
		<TransactionEdit :account="account" @finished="closeModal" />
	</Modal>
</template>
