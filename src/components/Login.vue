<script setup lang="ts">
import { FirebaseError } from "firebase/app";
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../store/authStore";

const toast = useToast();
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

		await router.replace("/accounts");
	} catch (error: unknown) {
		let message: string;
		if (error instanceof Error) {
			message = error.message;
		} else if (error instanceof FirebaseError) {
			message = error.code;
		} else {
			message = JSON.stringify(error);
		}

		if (message.includes("auth/invalid-email")) {
			toast.error("That doesn't quite look like an email address");
		} else if (message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
			toast.error("Incorrect email address or password.");
		} else if (message.includes("auth/email-already-in-use")) {
			toast.error("Someone already has an account with that email.");
		} else {
			toast.error(message);
		}
		console.error(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent="submit">
		<input ref="emailField" v-model="email" placeholder="email" required />
		<input v-model="password" type="password" placeholder="password" required />
		<input
			v-if="isSignupMode"
			v-model="passwordRepeat"
			type="password"
			placeholder="password again"
		/>
		<button type="submit" :disabled="isLoading">{{
			isSignupMode ? "Create an account" : "Log in"
		}}</button>
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

<style scoped lang="scss">
form {
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 36em;
	margin: 0 auto;

	button {
		margin: 1em 0;
	}

	input {
		text-align: center;
	}

	p {
		margin-top: 1em;
	}
}
</style>
