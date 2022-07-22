import { appTabs } from "../model/ui/tabs";
import {
	aboutPath,
	homePath,
	installPath,
	lockPath,
	loginPath,
	securityPath,
	signupPath,
} from "./routes";

export const APP_ROOTS = appTabs
	.map(tab => `/${tab}`)
	.concat([
		homePath(),
		aboutPath(),
		securityPath(),
		installPath(),
		loginPath(),
		lockPath(),
		signupPath(),
	]);

export * from "./routes";
export { default as Router } from "./Router.svelte";
