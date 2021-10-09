<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../store/authStore";

const auth = useAuthStore();

const isLoading = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const newPasswordRepeat = ref("");

async function submitNewPassword() {
	try {
		if (!currentPassword.value || !newPassword.value || !newPasswordRepeat.value) {
			throw new Error("Please fill out the required fields");
		}
		if (newPassword.value !== newPasswordRepeat.value) {
			throw new Error("Those passwords need to match");
		}

		isLoading.value = true;

		await auth.updatePassword(currentPassword.value, newPassword.value);
	} catch (error: unknown) {
		auth.handleAuthError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submitNewPassword">
		<h2>Change Password</h2>
		<input
			v-model="currentPassword"
			type="password"
			placeholder="current password"
			autocomplete="current-password"
			required
		/>
		<input
			v-model="newPassword"
			type="password"
			placeholder="new password"
			autocomplete="new-password"
			required
		/>
		<input
			v-model="newPasswordRepeat"
			type="password"
			placeholder="new password again"
			autocomplete="new-password"
			required
		/>
		<button type="submit" :disabled="isLoading">Change password</button>
	</form>
</template>
