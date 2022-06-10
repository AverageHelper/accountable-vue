<script setup lang="ts">
import ActionButton from "../../components/buttons/ActionButton.vue";
import NewLoginModal from "../../components/NewLoginModal.vue";
import TextField from "../../components/inputs/TextField.vue";
import { ref, computed } from "vue";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import { useUiStore } from "../../store";

const auth = useAuthStore();
const ui = useUiStore();
const toast = useToast();

const isLoading = ref(false);
const currentAccountId = computed(() => auth.accountId);
const currentPassword = ref("");

const hasChanges = computed(() => currentPassword.value !== "");

function reset() {
	currentPassword.value = "";
}

async function regenerateAccountId() {
	try {
		if (!currentPassword.value) {
			throw new Error("Please fill out the required fields"); // TODO: I18N
		}

		isLoading.value = true;

		await auth.regenerateAccountId(currentPassword.value);
		toast.success("Your account ID has been updated!"); // TODO: I18N
		reset();
	} catch (error) {
		ui.handleError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="regenerateAccountId">
		<!-- TODO: I18N -->
		<h3>Change Account ID</h3>
		<p>Somebody bothering you with your account ID? You can change it with one click:</p>
		<TextField
			:model-value="currentAccountId ?? 'b4dcb93bc0c04251a930541e1a3c9a80'"
			type="text"
			label="current account ID"
			disabled
		/>
		<TextField
			v-model="currentPassword"
			type="password"
			label="current passphrase"
			placeholder="********"
			autocomplete="current-password"
			:shows-required="false"
			required
		/>
		<div class="buttons">
			<ActionButton type="submit" kind="bordered-primary" :disabled="!hasChanges || isLoading"
				>Regenerate account ID</ActionButton
			>
			<ActionButton v-show="hasChanges" kind="bordered" :disabled="isLoading" @click.prevent="reset"
				>Reset</ActionButton
			>
		</div>
	</form>

	<NewLoginModal />
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
