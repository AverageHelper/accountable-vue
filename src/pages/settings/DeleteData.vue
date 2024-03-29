<script setup lang="ts">
import ActionButton from "../../components/buttons/ActionButton.vue";
import ConfirmDeleteEverything from "./ConfirmDeleteEverything.vue";
import TextField from "../../components/inputs/TextField.vue";
import { computed, ref } from "vue";
import { logoutPath } from "../../router";
import { useAuthStore, useUiStore } from "../../store";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const i18n = useI18n();

const accountId = computed(() => auth.accountId);
const password = ref("");
const isAskingToDelete = ref(false);
const isDeleting = ref(false);

const hasChanges = computed(() => password.value !== "");

function reset() {
	password.value = "";
}

function askToDeleteEverything() {
	isAskingToDelete.value = true;
}

async function confirmDeleteEverything() {
	isAskingToDelete.value = false;
	isDeleting.value = true;

	try {
		if (!password.value) throw new Error(i18n.t("error.form.missing-required-fields"));
		await auth.destroyVault(password.value);

		await router.push(logoutPath());
	} catch (error) {
		ui.handleError(error);
		isDeleting.value = false;
	}
}

function cancelDeleteEverything() {
	isAskingToDelete.value = false;
}
</script>

<template>
	<form @submit.prevent="askToDeleteEverything">
		<!-- TODO: I18N -->
		<h3>Delete Everything</h3>
		<p>You have the option to delete all of your data on Accountable.</p>

		<TextField
			:model-value="accountId ?? 'b4dcb93bc0c04251a930541e1a3c9a80'"
			type="text"
			label="account ID"
			disabled
		/>
		<TextField
			v-model="password"
			type="password"
			label="current passphrase"
			placeholder="********"
			autocomplete="current-password"
			:shows-required="false"
			required
		/>

		<div class="buttons">
			<ActionButton type="submit" kind="bordered-destructive" :disabled="!hasChanges || isDeleting">
				<span v-if="isDeleting">Deleting...</span>
				<span v-else>Delete Everything</span>
			</ActionButton>
			<ActionButton
				v-show="hasChanges"
				kind="bordered"
				:disabled="isDeleting"
				@click.prevent="reset"
				>Reset</ActionButton
			>
		</div>
	</form>

	<ConfirmDeleteEverything
		:is-open="isAskingToDelete"
		@yes="confirmDeleteEverything"
		@no="cancelDeleteEverything"
	/>
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
