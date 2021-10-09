<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";

const auth = useAuthStore();
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
	emailField.value.focus();
});

watch(mode, () => {
	emailField.value.focus();
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
		auth.handleAuthError(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submit">
		<input
			ref="emailField"
			v-model="email"
			type="text"
			placeholder="email"
			autocomplete="username"
			required
		/>
		<input
			v-model="password"
			type="password"
			placeholder="password"
			:autocomplete="isSignupMode ? 'new-password' : 'current-password'"
			required
		/>
		<input
			v-if="isSignupMode"
			v-model="passwordRepeat"
			type="password"
			placeholder="password again"
			autocomplete="new-password"
			:required="isSignupMode"
		/>
		<button type="submit" :disabled="isLoading">{{
			isSignupMode ? "Create an account" : "Log in"
		}}</button>
		<span v-if="loginProcessState === 'AUTHENTICATING'">Authenticating...</span>
		<span v-if="loginProcessState === 'GENERATING_KEYS'">Generating keys...</span>
		<span v-if="loginProcessState === 'FETCHING_KEYS'">Fetching keys...</span>
		<span v-if="loginProcessState === 'DERIVING_PKEY'">Deriving key from password...</span>

		<p v-if="isLoginMode"
			>Need to create an account?
			<a href="#" @click="enterSignupMode">Create one here.</a>
		</p>
		<p v-if="isSignupMode"
			>Already have an account?
			<a href="#" @click="enterLoginMode">Log in here.</a>
		</p>
	</form>
</template>
