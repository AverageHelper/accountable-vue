<script setup lang="ts">
import ActionButton from "../components/buttons/ActionButton.vue";
import ErrorNotice from "../components/ErrorNotice.vue";
import Footer from "../Footer.vue";
import TextField from "../components/inputs/TextField.vue";
import { accountsPath, loginPath, signupPath } from "../router";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const isLoggedIn = computed(() => auth.uid !== null);
const bootstrapError = computed(() => ui.bootstrapError);
const accountId = ref("");
const password = ref("");
const passwordRepeat = ref("");
const isLoading = ref(false);
const mode = computed<"login" | "signup">(() => {
	return route.path === signupPath() ? "signup" : "login";
});
const isSignupMode = computed(() => mode.value === "signup");
const isLoginMode = computed(() => mode.value === "login");
const loginProcessState = computed(() => auth.loginProcessState);

const accountIdField = ref<HTMLInputElement | null>(null);
const passwordField = ref<HTMLInputElement | null>(null);

onMounted(() => {
	accountIdField.value?.focus();
	ui.bootstrap();
});

watch(
	mode,
	async mode => {
		await nextTick();
		switch (mode) {
			case "login":
				accountIdField.value?.focus();
				break;
			case "signup":
				passwordField.value?.focus();
				break;
		}
	},
	{ immediate: true }
);

watch(
	isLoggedIn,
	async isLoggedIn => {
		if (isLoggedIn) {
			await router.push(accountsPath());
		} else if (route.path !== loginPath() && route.path !== signupPath()) {
			switch (mode.value) {
				case "login":
					await router.push(loginPath());
					break;
				case "signup":
					await router.push(signupPath());
					break;
			}
		}
	},
	{ immediate: true }
);

function enterSignupMode() {
	accountId.value = "";
	void router.replace(signupPath());
}

function enterLoginMode() {
	accountId.value = "";
	void router.replace(loginPath());
}

function onUpdateAccountId(newId: string) {
	if (!isSignupMode.value || isLoading.value) {
		accountId.value = newId;
	}
}

async function submit() {
	try {
		isLoading.value = true;
		if (isSignupMode.value) {
			// Don't let the user pick their own account ID
			accountId.value = auth.createAccountId();
			await nextTick();
		}

		if (!accountId.value || !password.value || (isSignupMode.value && !passwordRepeat.value)) {
			throw new Error("Please fill out the required fields");
		}
		if (isSignupMode.value && password.value !== passwordRepeat.value) {
			throw new Error("Those passwords need to match");
		}

		switch (mode.value) {
			case "signup":
				await auth.createVault(accountId.value, password.value);
				break;

			case "login":
				await auth.login(accountId.value, password.value);
				break;
		}

		await nextTick();
		await router.replace(accountsPath());
	} catch (error: unknown) {
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
			<TextField
				ref="accountIdField"
				v-model="accountId"
				:model-value="isSignupMode && !isLoading ? 'to be generated...' : accountId"
				:disabled="isSignupMode && !isLoading"
				label="account ID"
				placeholder="b4dcb93bc0c04251a930541e1a3c9a80"
				autocomplete="username"
				:shows-required="false"
				required
				@update:modelValue="onUpdateAccountId"
			/>
			<TextField
				ref="passwordField"
				v-model="password"
				type="password"
				:label="isSignupMode ? 'Create a strong passphrase' : 'passphrase'"
				placeholder="********"
				:autocomplete="isSignupMode ? 'new-password' : 'current-password'"
				:shows-required="false"
				required
			/>
			<TextField
				v-if="isSignupMode"
				v-model="passwordRepeat"
				type="password"
				label="passphrase again"
				placeholder="********"
				autocomplete="new-password"
				:shows-required="false"
				:required="isSignupMode"
			/>
			<ActionButton
				type="submit"
				:kind="isSignupMode ? 'bordered-primary-green' : 'bordered-primary'"
				:disabled="isLoading"
				>{{ isSignupMode ? "Create an account" : "Log in" }}</ActionButton
			>
			<span v-if="loginProcessState === 'AUTHENTICATING'">Authenticating...</span>
			<span v-if="loginProcessState === 'GENERATING_KEYS'">Generating keys...</span>
			<span v-if="loginProcessState === 'FETCHING_KEYS'">Fetching keys...</span>
			<span v-if="loginProcessState === 'DERIVING_PKEY'">Deriving key from passphrase...</span>

			<div v-if="!isLoading">
				<p v-if="isLoginMode"
					>Need to create an account?
					<a href="#" @click.prevent="enterSignupMode">Create one!</a>
				</p>
				<p v-if="isSignupMode"
					>Already have an account?
					<a href="#" @click.prevent="enterLoginMode">Log in!</a>
				</p>
			</div>
		</form>
		<Footer />
	</main>
</template>
