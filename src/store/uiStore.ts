import { defineStore } from "pinia";
import { AccountableError, bootstrap, db, isWrapperInstantiated } from "../transport/db.js";
import { getServerVersion } from "../transport/server.js";
import { useToast } from "vue-toastification";
import { StructError } from "superstruct";

type ColorScheme = "light" | "dark";

export const useUiStore = defineStore("ui", {
	state: () => ({
		preferredColorScheme: "light" as ColorScheme,
		serverVersion: null as string | Error | null,
		bootstrapError: null as Error | null,
		totalSpace: null as number | null,
		usedSpace: null as number | null,
	}),
	getters: {
		serverLoadingError(): Error | null {
			const v: string | Error | null = this.serverVersion;
			if (v instanceof Error) return v;
			return null;
		},
	},
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
		updateTotalSpace(totalSpace: number | undefined) {
			// `null` == unknown value; if we get `undefined` here, use what we last knew.
			this.totalSpace = totalSpace ?? this.totalSpace;
		},
		updateUsedSpace(usedSpace: number | undefined) {
			// `null` == unknown value; if we get `undefined` here, use what we last knew.
			this.usedSpace = usedSpace ?? this.usedSpace;
		},
		bootstrap() {
			if (isWrapperInstantiated()) return;

			try {
				bootstrap();
			} catch (error: unknown) {
				if (error instanceof Error) {
					this.bootstrapError = error;
				} else {
					this.bootstrapError = new Error(JSON.stringify(error));
				}
			}
		},
		async loadServerVersion() {
			if (typeof this.serverVersion === "string") return;
			this.bootstrap();

			try {
				this.serverVersion = "loading";
				this.serverVersion = await getServerVersion(db);
			} catch (error: unknown) {
				console.error(error);
				if (error instanceof Error) {
					this.serverVersion = error;
				} else {
					this.serverVersion = new Error(JSON.stringify(error));
				}
			}
		},
		handleError(error: unknown) {
			const toast = useToast();

			let message: string;
			if (error instanceof Error) {
				message = error.message;
			} else if (error instanceof AccountableError) {
				message = error.code;
			} else if (error instanceof StructError) {
				message = `ValidationError: ${error.message}`;
			} else {
				message = JSON.stringify(error);
			}

			if (message.includes("auth/invalid-email")) {
				toast.error("That doesn't quite look like an email address. (You should never see this)");
			} else if (
				message.includes("auth/wrong-password") ||
				message.includes("auth/user-not-found")
			) {
				toast.error("Incorrect account ID or password.");
			} else if (message.includes("auth/email-already-in-use")) {
				toast.error("Someone already has an account with that ID.");
			} else {
				toast.error(message);
			}
			console.error(error);
		},
	},
});
