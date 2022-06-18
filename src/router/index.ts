import type { NavigationGuard, RouteRecordRaw } from "vue-router";
import About from "../About.vue";
import Accounts from "../pages/accounts/Accounts.vue";
import AccountView from "../pages/accounts/AccountView.vue";
import Attachments from "../pages/attachments/Attachments.vue";
import EmptyRoute from "../pages/EmptyRoute.vue";
import Home from "../Home.vue";
import Install from "../Install.vue";
import Locations from "../pages/locations/Locations.vue";
import Locked from "../pages/auth/Locked.vue";
import Login from "../pages/auth/Login.vue";
import MonthView from "../pages/transactions/MonthView.vue";
import Security from "../Security.vue";
import Settings from "../pages/settings/Settings.vue";
import Tags from "../pages/tags/Tags.vue";
import TransactionView from "../pages/transactions/TransactionView.vue";
import { appTabs } from "../model/ui/tabs";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/authStore";
import {
	aboutPath,
	accountsPath,
	attachmentsPath,
	homePath,
	installPath,
	locationsPath,
	lockPath,
	loginPath,
	logoutPath,
	securityPath,
	settingsPath,
	signupPath,
	tagsPath,
} from "./routes";

export * from "./routes";

// See https://next.router.vuejs.org/guide/advanced/meta.html#typescript about adding types to the `meta` field

// type RouteTitleGetter = () => string;
// type RouteTitle = string | RouteTitleGetter;

// declare module "vue-router" {
// 	interface RouteMeta {
// 		title?: RouteTitle;
// 	}
// }

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

const onlyIfLoggedIn: NavigationGuard = async (from, to, next) => {
	const auth = useAuthStore();
	if (auth.uid === null) await auth.fetchSession();
	if (auth.pKey !== null) {
		console.debug("[onlyIfLoggedIn] We have a pKey");
		next();
	} else if (auth.uid !== null) {
		console.debug("[onlyIfLoggedIn] We have no pKey, but a uid");
		next(lockPath());
	} else {
		console.debug("[onlyIfLoggedIn] We have no pKey or uid");
		next(loginPath());
	}
};

const accounts: RouteRecordRaw = {
	path: accountsPath(),
	beforeEnter: onlyIfLoggedIn,
	component: EmptyRoute,
	children: [
		{
			path: "",
			component: Accounts,
		},
		{
			path: ":accountId",
			component: EmptyRoute,
			children: [
				{
					path: "",
					component: AccountView,
					props: true,
				},
				{
					path: "months/:rawMonth",
					component: MonthView,
					props: true,
				},
				{
					path: "transactions/:transactionId",
					component: TransactionView,
					props: true,
				},
			],
		},
	],
};

const attachments: RouteRecordRaw = {
	path: attachmentsPath(),
	beforeEnter: onlyIfLoggedIn,
	component: Attachments,
};

const locations: RouteRecordRaw = {
	path: locationsPath(),
	beforeEnter: onlyIfLoggedIn,
	component: Locations,
};

const tags: RouteRecordRaw = {
	path: tagsPath(),
	beforeEnter: onlyIfLoggedIn,
	component: Tags,
};

const settings: RouteRecordRaw = {
	path: settingsPath(),
	beforeEnter: onlyIfLoggedIn,
	component: Settings,
};

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: homePath(),
			component: Home,
		},
		{
			path: aboutPath(),
			component: About,
		},
		{
			path: securityPath(),
			component: Security,
		},
		{
			path: installPath(),
			component: Install,
		},
		{
			path: logoutPath(),
			component: EmptyRoute,
			async beforeEnter(to, from, next): Promise<void> {
				const auth = useAuthStore();
				console.debug("Logging out...");
				await auth.logout();
				next(loginPath());
			},
		},
		{
			path: loginPath(),
			component: Login,
			async beforeEnter(from, to, next): Promise<void> {
				const auth = useAuthStore();
				if (auth.uid === null) await auth.fetchSession();
				if (auth.pKey !== null) {
					console.debug(`[${loginPath()}] We have a pKey`);
					next(accountsPath()); // vault is unlocked; go home
				} else if (auth.uid !== null) {
					console.debug(`[${loginPath()}] We have no pKey, but a uid`);
					next(lockPath()); // vault is locked
				} else {
					console.debug(`[${loginPath()}] We have no pKey or uid`);
					next(); // go to login
				}
			},
		},
		{
			path: lockPath(),
			component: Locked,
			async beforeEnter(from, to, next): Promise<void> {
				const auth = useAuthStore();
				if (auth.uid === null) await auth.fetchSession();
				if (auth.pKey !== null) {
					console.debug(`[${lockPath()}] We have a pKey`);
					auth.lockVault(); // lock vault
					next();
				} else if (auth.uid === null) {
					console.debug(`[${lockPath()}] We have no pKey or uid`);
					next(loginPath()); // nothing to unlock
				} else {
					console.debug(`[${lockPath()}] We have no pKey, but a uid`);
					next(); // already locked
				}
			},
		},
		{
			path: signupPath(),
			component: Login,
			beforeEnter(from, to, next): void {
				const auth = useAuthStore();
				if (auth.uid !== null) {
					next(accountsPath());
				} else {
					next();
				}
			},
		},
		accounts,
		attachments,
		locations,
		tags,
		settings,
	],
});
