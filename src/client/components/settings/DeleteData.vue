<script setup lang="ts">
import ActionButton from "../ActionButton.vue";
import ConfirmDeleteEverything from "./ConfirmDeleteEverything.vue";
import TextField from "../TextField.vue";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore, useUiStore } from "../../store";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

const email = computed(() => auth.email);
const password = ref("");
const isAskingToDelete = ref(false);
const isDeleting = ref(false);

function askToDeleteEverything() {
	isAskingToDelete.value = true;
}

async function confirmDeleteEverything() {
	isAskingToDelete.value = false;
	isDeleting.value = true;

	try {
		if (email.value === null || !email.value) throw new Error("Email is required.");
		if (!password.value) throw new Error("Password is required.");

		await auth.destroyVault(email.value, password.value);
		await router.push("/logout");
	} catch (error: unknown) {
		ui.handleError(error);
		isDeleting.value = true;
	}
}

function cancelDeleteEverything() {
	isAskingToDelete.value = false;
}
</script>

<template>
	<form @submit.prevent="askToDeleteEverything">
		<h3>Delete Everything</h3>
		<p>You have the option to delete all of your data on Accountable.</p>

		<TextField
			:model-value="email ?? 'johnny.appleseed@example.com'"
			type="email"
			label="current email"
			disabled
		/>
		<TextField
			v-model="password"
			type="password"
			label="current password"
			placeholder="********"
			autocomplete="current-password"
			:shows-required="false"
			required
		/>
		<ActionButton type="submit" kind="bordered-destructive" :disabled="isDeleting">
			<span v-if="isDeleting">Deleting...</span>
			<span v-else>Delete Everything</span>
		</ActionButton>
	</form>

	<ConfirmDeleteEverything
		:is-open="isAskingToDelete"
		@yes="confirmDeleteEverything"
		@no="cancelDeleteEverything"
	/>
</template>
