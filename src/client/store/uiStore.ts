import { defineStore } from "pinia";
import { FirebaseError } from "firebase/app";
import { useToast } from "vue-toastification";

type ColorScheme = "light" | "dark";

export const useUiStore = defineStore("ui", {
	state: () => ({
		preferredColorScheme: "light" as ColorScheme,
	}),
	actions: {
		watchColorScheme(): void {
			const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
			const isLightMode = window.matchMedia("(prefers-color-scheme: light)").matches;
			const isNotSpecified = window.matchMedia("(prefers-color-scheme: no-preference)").matches;
			const hasNoSupport = !isDarkMode && !isLightMode && !isNotSpecified;

			window
				.matchMedia("(prefers-color-scheme: dark)")
				.addEventListener("change", e => e.matches && this.activateDarkMode());
			window
				.matchMedia("(prefers-color-scheme: light)")
				.addEventListener("change", e => e.matches && this.activateLightMode());

			if (isDarkMode) this.activateDarkMode();
			if (isLightMode) this.activateLightMode();
			if (isNotSpecified || hasNoSupport) {
				console.warn("System color scheme not supported. Defaulting to light.");
				this.activateLightMode();
			}
		},
		activateDarkMode(): void {
			this.preferredColorScheme = "dark";
		},
		activateLightMode(): void {
			this.preferredColorScheme = "light";
		},
		handleError(error: unknown) {
			const toast = useToast();

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
			} else if (
				message.includes("auth/wrong-password") ||
				message.includes("auth/user-not-found")
			) {
				toast.error("Incorrect email address or password.");
			} else if (message.includes("auth/email-already-in-use")) {
				toast.error("Someone already has an account with that email.");
			} else {
				toast.error(message);
			}
			console.error(error);
		},
	},
});
