<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import Modal from "./Modal.vue";
import { useAuthStore } from "../store";
import { computed, ref } from "vue";
import ConfirmGotNewAccountId from "./ConfirmGotNewAccountId.vue";

const auth = useAuthStore();

const isNewLogin = computed(() => auth.isNewLogin);
const accountId = computed(() => auth.accountId);
const isConfirmingUserKnowledge = ref(false);

function askToClearNewLoginStatus() {
	isConfirmingUserKnowledge.value = true;
}

function confirmClearNewLoginStatus() {
	isConfirmingUserKnowledge.value = false;
	auth.clearNewLoginStatus();
}

function cancelClearNewLoginStatus() {
	isConfirmingUserKnowledge.value = false;
}
</script>

<template>
	<Modal :open="isNewLogin">
		<h1>Your New Account</h1>
		<p>This is your new account ID. You will need it and your password to log in later.</p>
		<p
			>REMEMBER THIS: <code v-if="isNewLogin">{{ accountId }}</code></p
		>
		<p>Write it down.</p>
		<p>If you lose it, we won't be able to get it back for you.</p>

		<ActionButton kind="bordered-primary" @click.prevent="askToClearNewLoginStatus"
			>Got it</ActionButton
		>
	</Modal>

	<ConfirmGotNewAccountId
		:is-open="isConfirmingUserKnowledge"
		@yes="confirmClearNewLoginStatus"
		@no="cancelClearNewLoginStatus"
	/>
</template>
