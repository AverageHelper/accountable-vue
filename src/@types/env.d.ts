declare module "*.svelte" {
	import type { ComponentType } from "svelte";
	const component: ComponentType;
	export default component;
}

// See https://vitejs.dev/guide/env-and-mode.html
interface ImportMetaEnv extends Readonly<Record<string, string>> {
	readonly VITE_ACCOUNTABLE_SERVER_URL: string | undefined;
	readonly VITE_ENABLE_SIGNUP: string | undefined;
	readonly VITE_ENABLE_LOGIN: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
