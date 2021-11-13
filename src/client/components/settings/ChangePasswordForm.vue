<script setup lang="ts">
import ActionButton from "../ActionButton.vue";
import TextField from "../TextField.vue";
import { computed, ref } from "vue";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";

const auth = useAuthStore();
const toast = useToast();

const isLoading = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const newPasswordRepeat = ref("");

const hasChanges = computed(() => {
	return (
		currentPassword.value !== "" &&
		newPassword.value !== "" &&
		newPassword.value === newPasswordRepeat.value
	);
});

function reset() {
	currentPassword.value = "";
	newPassword.value = "";
	newPasswordRepeat.value = "";
}

async function submitNewPassword() {
	try {
		if (!currentPassword.value || !newPassword.value || !newPasswordRepeat.value) {
			throw new Error("All fields are required");
		}
		if (newPassword.value !== newPasswordRepeat.value) {
			throw new Error("Those passwords need to match");
		}

		isLoading.value = true;

		await auth.updatePassword(currentPassword.value, newPassword.value);
		toast.success("Your password has been updated!");
		reset();
	} catch (error: unknown) {
		auth.handleAuthError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submitNewPassword">
		<h3>Change Password</h3>
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
		<ActionButton type="submit" kind="bordered-primary" :disabled="!hasChanges || isLoading"
			>Change password</ActionButton
		>
	</form>
</template>
