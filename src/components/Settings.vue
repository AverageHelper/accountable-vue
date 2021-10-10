<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import TextField from "./TextField.vue";
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
		<TextField
			v-model="currentPassword"
			type="password"
			label="current password"
			placeholder="********"
			autocomplete="current-password"
			:shows-required="false"
			required
		/>
		<TextField
			v-model="newPassword"
			type="password"
			label="new password"
			placeholder="************"
			autocomplete="new-password"
			:shows-required="false"
			required
		/>
		<TextField
			v-model="newPasswordRepeat"
			type="password"
			label="new password again"
			placeholder="************"
			autocomplete="new-password"
			:shows-required="false"
			required
		/>
		<ActionButton class="submit" type="submit" kind="bordered" :disabled="isLoading"
			>Change password</ActionButton
		>
	</form>
</template>

<style scoped lang="scss">
.submit {
	margin: 1em 0;
}
</style>
