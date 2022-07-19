import { AccountableError, NetworkError } from "../transport/errors/index.js";
import { bootstrap, db, getUserStats, isWrapperInstantiated } from "../transport/db.js";
import { defineStore } from "pinia";
import { getServerVersion } from "../transport/server.js";
import { StructError } from "superstruct";
import { toast } from "@zerodevx/svelte-toast";

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
			// TODO: Reenable light mode
			// this.preferredColorScheme = "light";
			this.preferredColorScheme = "dark";
		},
		async updateUserStats() {
			const { usedSpace, totalSpace } = await getUserStats();
			this.usedSpace = usedSpace;
			this.totalSpace = totalSpace;
		},
		bootstrap() {
			if (isWrapperInstantiated()) return;

			try {
				bootstrap();
			} catch (error) {
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
			} catch (error) {
				console.error(error);
				if (error instanceof Error) {
					this.serverVersion = error;
				} else {
					this.serverVersion = new Error(JSON.stringify(error));
				}
			}
		},
		handleError(error: unknown) {
			// TODO: I18N
			let message: string;
			if (error instanceof Error || error instanceof NetworkError) {
				message = error.message;
			} else if (error instanceof AccountableError) {
				message = error.code;
			} else if (error instanceof StructError) {
				message = `ValidationError: ${error.message}`;
			} else {
				message = JSON.stringify(error);
			}

			if (message.includes("auth/invalid-email")) {
				toast.push("That doesn't quite look like an email address. (You should never see this)", {
					classes: ["toast-error"],
				});
			} else if (
				message.includes("auth/wrong-password") ||
				message.includes("auth/user-not-found")
			) {
				toast.push("Incorrect account ID or password.", { classes: ["toast-error"] });
			} else if (message.includes("auth/email-already-in-use")) {
				toast.push("Someone already has an account with that ID.", { classes: ["toast-error"] });
			} else {
				toast.push(message, { classes: ["toast-error"] });
			}
			console.error(error);
		},
	},
});
