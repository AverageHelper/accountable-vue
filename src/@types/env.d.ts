// eslint-disable-next-line spaced-comment
/// <reference types="vite/client" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

// See https://vitejs.dev/guide/env-and-mode.html
type EnvKey =
	| "FIREBASE_API_KEY" // VITE_FIREBASE_API_KEY
	| "FIREBASE_PROJECT_ID"; // VITE_FIREBASE_PROJECT_ID

interface ImportMetaEnv extends Readonly<Record<string, string>> {
	readonly VITE_FIREBASE_API_KEY: string | undefined;
	readonly VITE_FIREBASE_PROJECT_ID: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
