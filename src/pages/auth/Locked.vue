<script setup lang="ts">
import ActionButton from "../../components/buttons/ActionButton.vue";
import ErrorNotice from "../../components/ErrorNotice.vue";
import Footer from "../../Footer.vue";
import TextField from "../../components/inputs/TextField.vue";
import { accountsPath } from "../../router";
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useI18n } from "vue-i18n";
import { useUiStore } from "../../store";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const i18n = useI18n();

const bootstrapError = computed(() => ui.bootstrapError);
const accountId = computed(() => auth.accountId ?? "");
const password = ref("");
const isLoading = ref(false);
const loginProcessState = computed(() => auth.loginProcessState);

const accountIdField = ref<HTMLInputElement | null>(null);
const passwordField = ref<HTMLInputElement | null>(null);

onMounted(() => {
	passwordField.value?.focus();
	ui.bootstrap();
});

async function submit() {
	try {
		isLoading.value = true;

		if (!accountId.value || !password.value)
			throw new Error(i18n.t("error.form.missing-required-fields"));

		await auth.unlockVault(password.value);

		await nextTick();
		await router.replace(accountsPath());
	} catch (error) {
		ui.handleError(error);
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
	<main v-if="bootstrapError" class="content">
		<ErrorNotice :error="bootstrapError" />
		<Footer />
	</main>
	<main v-else class="content">
		<form @submit.prevent="submit">
			<p>{{ $t("locked.heading") }}</p>

			<TextField
				ref="accountIdField"
				:model-value="accountId"
				:disabled="true"
				:label="$t('login.account-id')"
				autocomplete="username"
				:shows-required="false"
				required
			/>
			<TextField
				ref="passwordField"
				v-model="password"
				type="password"
				:label="$t('login.current-passphrase')"
				placeholder="********"
				autocomplete="current-password"
				:shows-required="false"
				required
			/>
			<ActionButton type="submit" kind="bordered-primary" :disabled="isLoading">{{
				$t("locked.unlock")
			}}</ActionButton>

			<span v-if="loginProcessState === 'AUTHENTICATING'">{{
				$t("login.process.authenticating")
			}}</span>
			<span v-if="loginProcessState === 'GENERATING_KEYS'">{{
				$t("login.process.generating-keys")
			}}</span>
			<span v-if="loginProcessState === 'FETCHING_KEYS'">{{
				$t("login.process.fetching-keys")
			}}</span>
			<span v-if="loginProcessState === 'DERIVING_PKEY'">{{
				$t("login.process.deriving-pkey")
			}}</span>
		</form>
		<Footer />
	</main>
</template>
