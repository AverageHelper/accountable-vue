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
	readonly VITE_ACCOUNTABLE_SERVER_URL: string | undefined;
	readonly VITE_ENABLE_LOGIN: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
