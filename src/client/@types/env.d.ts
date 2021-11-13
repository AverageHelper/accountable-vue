// eslint-disable-next-line spaced-comment
/// <reference types="vite/client" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

// See https://vitejs.dev/guide/env-and-mode.html
interface ImportMetaEnv extends Readonly<Record<string, string>> {
	readonly VITE_FIREBASE_API_KEY: string | undefined;
	readonly VITE_FIREBASE_STORAGE_BUCKET: string | undefined;
	readonly VITE_FIREBASE_AUTH_DOMAIN: string | undefined;
	readonly VITE_FIREBASE_PROJECT_ID: string | undefined;
	readonly VITE_FREEGEOIP_API_KEY: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
