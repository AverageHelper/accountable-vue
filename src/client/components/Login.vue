<script setup lang="ts">
import ActionButton from "./ActionButton.vue";
import AppVersion from "./AppVersion.vue";
import NavTitle from "./NavTitle.vue";
import TextField from "./TextField.vue";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const isLoggedIn = computed(() => auth.uid !== null);
const email = ref("");
const password = ref("");
const passwordRepeat = ref("");
const isLoading = ref(false);
const mode = ref<"login" | "signup">("login");
const isSignupMode = computed(() => mode.value === "signup");
const isLoginMode = computed(() => mode.value === "login");
const loginProcessState = computed(() => auth.loginProcessState);

const emailField = ref<HTMLInputElement | null>(null);

onMounted(() => {
	emailField.value?.focus();
});

watch(mode, () => {
	emailField.value?.focus();
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
	mode.value = "signup";
}

function enterLoginMode() {
	mode.value = "login";
}

async function submit() {
	try {
		if (!email.value || !password.value || (isSignupMode.value && !passwordRepeat.value)) {
			throw new Error("Please fill out the required fields");
		}
		if (isSignupMode.value && password.value !== passwordRepeat.value) {
			throw new Error("Those passwords need to match");
		}

		isLoading.value = true;

		switch (mode.value) {
			case "signup":
				await auth.createVault(email.value, password.value);
				break;

			case "login":
				await auth.login(email.value, password.value);
				break;
		}

		await nextTick();
		await router.replace("/accounts");
	} catch (error: unknown) {
		ui.handleError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<NavTitle>Login</NavTitle>

	<form @submit.prevent="submit">
		<TextField
			ref="emailField"
			v-model="email"
			label="email"
			placeholder="john.doe@example.com"
			autocomplete="username"
			:shows-required="false"
			required
		/>
		<TextField
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
