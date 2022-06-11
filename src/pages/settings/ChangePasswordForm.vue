<script setup lang="ts">
import ActionButton from "../../components/buttons/ActionButton.vue";
import TextField from "../../components/inputs/TextField.vue";
import { computed, ref } from "vue";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import { useI18n } from "vue-i18n";
import { useUiStore } from "../../store";

const auth = useAuthStore();
const ui = useUiStore();
const toast = useToast();
const i18n = useI18n();

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
			throw new Error(i18n.t("error.form.missing-required-fields"));
		}
		if (newPassword.value !== newPasswordRepeat.value) {
			throw new Error(i18n.t("error.form.password-mismatch"));
		}

		isLoading.value = true;

		await auth.updatePassword(currentPassword.value, newPassword.value);
		toast.success("Your passphrase has been updated!"); // TODO: I18N
		reset();
	} catch (error) {
		ui.handleError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submitNewPassword">
		<!-- TODO: I18N -->
		<h3>Change Passphrase</h3>
		<TextField
			v-model="currentPassword"
			type="password"
			label="current passphrase"
			placeholder="********"
			autocomplete="current-password"
			:shows-required="false"
			required
		/>
		<TextField
			v-model="newPassword"
			type="password"
			label="new passphrase"
			placeholder="************"
			autocomplete="new-password"
			:shows-required="false"
			required
		/>
		<TextField
			v-model="newPasswordRepeat"
			type="password"
			label="new passphrase again"
			placeholder="************"
			autocomplete="new-password"
			:shows-required="false"
			required
		/>
		<div class="buttons">
			<ActionButton type="submit" kind="bordered-primary" :disabled="!hasChanges || isLoading"
				>Change passphrase</ActionButton
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
