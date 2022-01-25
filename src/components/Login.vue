<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import AppVersion from "./AppVersion.vue";
import ErrorNotice from "./ErrorNotice.vue";
import TextField from "./TextField.vue";
import { bootstrap, isWrapperInstantiated } from "../transport";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const isLoggedIn = computed(() => auth.uid !== null);
const bootstrapError = ref<Error | null>(null);
const accountId = ref("");
const password = ref("");
const passwordRepeat = ref("");
const isLoading = ref(false);
const mode = ref<"login" | "signup">("login");
const isSignupMode = computed(() => mode.value === "signup");
const isLoginMode = computed(() => mode.value === "login");
const loginProcessState = computed(() => auth.loginProcessState);

const accountIdField = ref<HTMLInputElement | null>(null);
const passwordField = ref<HTMLInputElement | null>(null);

onMounted(() => {
	accountIdField.value?.focus();

	if (isWrapperInstantiated()) return;
	try {
		bootstrap();
	} catch (error: unknown) {
		if (error instanceof Error) {
			bootstrapError.value = error;
		} else {
			bootstrapError.value = new Error(JSON.stringify(error));
		}
	}
});

watch(mode, mode => {
	switch (mode) {
		case "login":
			accountIdField.value?.focus();
			break;
		case "signup":
			passwordField.value?.focus();
			break;
	}
});

watch(
	isLoggedIn,
	async isLoggedIn => {
		if (isLoggedIn) {
			await router.push("/accounts");
		} else if (route.path !== "/login") {
			await router.push("/login");
		}
	},
	{ immediate: true }
);

function enterSignupMode() {
	accountId.value = "";
	mode.value = "signup";
}

function enterLoginMode() {
	accountId.value = "";
	mode.value = "login";
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
		await router.replace("/accounts");
	} catch (error: unknown) {
		ui.handleError(error);
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
	<ErrorNotice :error="bootstrapError" />
	<form v-if="!bootstrapError" @submit.prevent="submit">
		<TextField
			ref="accountIdField"
			v-model="accountId"
			:model-value="isSignupMode && !isLoading ? 'to be generated...' : accountId"
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
			label="password"
			placeholder="********"
			:autocomplete="isSignupMode ? 'new-password' : 'current-password'"
			:shows-required="false"
			required
		/>
		<TextField
			v-if="isSignupMode"
			v-model="passwordRepeat"
			type="password"
			label="password again"
			placeholder="********"
			autocomplete="new-password"
			:shows-required="false"
			:required="isSignupMode"
		/>
		<ActionButton type="submit" kind="bordered" :disabled="isLoading">{{
			isSignupMode ? "Create an account" : "Log in"
		}}</ActionButton>
		<span v-if="loginProcessState === 'AUTHENTICATING'">Authenticating...</span>
		<span v-if="loginProcessState === 'GENERATING_KEYS'">Generating keys...</span>
		<span v-if="loginProcessState === 'FETCHING_KEYS'">Fetching keys...</span>
		<span v-if="loginProcessState === 'DERIVING_PKEY'">Deriving key from password...</span>

		<div v-if="!isLoading">
			<p v-if="isLoginMode"
				>Need to create an account?
				<a href="#" @click="enterSignupMode">Create one here.</a>
			</p>
			<p v-if="isSignupMode"
				>Already have an account?
				<a href="#" @click="enterLoginMode">Log in here.</a>
			</p>
		</div>

		<AppVersion v-if="!isLoading" />
	</form>
</template>
