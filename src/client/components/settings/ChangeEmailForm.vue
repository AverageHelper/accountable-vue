<script setup lang="ts">
import ActionButton from "../ActionButton.vue";
import TextField from "../TextField.vue";
import { ref, computed } from "vue";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import { useUiStore } from "../../store";

const auth = useAuthStore();
const ui = useUiStore();
const toast = useToast();

const isLoading = ref(false);
const currentEmail = computed(() => auth.email);
const newEmail = ref("");
const currentPassword = ref("");

const hasChanges = computed(() => {
	return newEmail.value !== "" && currentPassword.value !== "";
});

function reset() {
	newEmail.value = "";
	currentPassword.value = "";
}

async function submitNewEmail() {
	try {
		if (!currentPassword.value || !newEmail.value) {
			throw new Error("Please fill out the required fields");
		}

		isLoading.value = true;

		await auth.updateEmail(newEmail.value, currentPassword.value);
		toast.success("Your email has been updated!");
		reset();
	} catch (error: unknown) {
		ui.handleError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submitNewEmail">
		<h3>Change Email</h3>
		<TextField
			:model-value="currentEmail ?? 'johnny.appleseed@example.com'"
			type="email"
			label="current email"
			disabled
		/>
		<TextField
			v-model="newEmail"
			type="email"
			label="new email"
			placeholder="johnny.appleseed@example.com"
			autocomplete="email"
			:shows-required="false"
			required
		/>
		<TextField
			v-model="currentPassword"
			type="password"
			label="current password"
			placeholder="********"
			autocomplete="current-password"
			:shows-required="false"
			required
		/>
		<div class="buttons">
			<ActionButton type="submit" kind="bordered-primary" :disabled="!hasChanges || isLoading"
				>Change email</ActionButton
			>
			<ActionButton v-show="hasChanges" kind="bordered" :disabled="isLoading" @click.prevent="reset"
				>Reset</ActionButton
			>
		</div>
	</form>
</template>

<style scoped lang="scss">
.buttons {
	display: flex;
	flex-flow: row nowrap;

	:not(:last-child) {
		margin-right: 8pt;
	}
}
</style>
