import { defineStore } from "pinia";

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
	},
});
