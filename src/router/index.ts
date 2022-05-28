import type { NavigationGuard, RouteRecordRaw } from "vue-router";
import About from "../About.vue";
import Accounts from "../pages/accounts/Accounts.vue";
import AccountView from "../pages/accounts/AccountView.vue";
import Attachments from "../pages/attachments/Attachments.vue";
import EmptyRoute from "../pages/EmptyRoute.vue";
import Home from "../Home.vue";
import Install from "../Install.vue";
import Locations from "../pages/locations/Locations.vue";
import Login from "../pages/Login.vue";
import Security from "../Security.vue";
import Settings from "../pages/settings/Settings.vue";
import Tags from "../pages/tags/Tags.vue";
import TransactionView from "../pages/transactions/TransactionView.vue";
import { appTabs } from "../model/ui/tabs";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/authStore";
import {
	about as aboutPath,
	accounts as accountsPath,
	attachments as attachmentsPath,
	home as homePath,
	install as installPath,
	locations as locationsPath,
	login as loginPath,
	logout as logoutPath,
	security as securityPath,
	settings as settingsPath,
	signup as signupPath,
	tags as tagsPath,
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
	.concat([homePath(), aboutPath(), securityPath(), installPath(), loginPath(), signupPath()]);

const onlyIfLoggedIn: NavigationGuard = (from, to, next) => {
	const auth = useAuthStore();
	if (auth.uid !== null) {
		next();
	} else {
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
				await auth.logout();
				next(loginPath());
			},
		},
		{
			path: loginPath(),
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
