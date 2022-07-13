<script setup lang="ts">
import ActionButton from "./buttons/ActionButton.vue";
import ConfirmGotNewAccountId from "./ConfirmGotNewAccountId.vue";
import Modal from "./Modal.vue";
import OutLink from "./OutLink.vue";
import { useAuthStore } from "../store";
import { computed, ref } from "vue";

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
		<h1>{{ $t("login.new-account.heading") }}</h1>
		<p>{{ $t("login.new-account.p1") }}</p>
		<i18n-t keypath="login.new-account.remember-this" tag="p">
			<template #accountId>
				<code v-if="isNewLogin">{{ accountId }}</code>
			</template>
		</i18n-t>
		<i18n-t keypath="login.new-account.write-it-down" tag="p">
			<template #manager>
				<OutLink to="https://bitwarden.com">{{ $t("login.new-account.manager") }}</OutLink>
			</template>
		</i18n-t>
		<p>{{ $t("login.new-account.no-recovery") }}</p>

		<ActionButton kind="bordered-primary" @click.prevent="askToClearNewLoginStatus">{{
			$t("login.new-account.acknowledge")
		}}</ActionButton>
	</Modal>

	<ConfirmGotNewAccountId
		:is-open="isConfirmingUserKnowledge"
		@yes="confirmClearNewLoginStatus"
		@no="cancelClearNewLoginStatus"
	/>
</template>
