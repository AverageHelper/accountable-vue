import type { NavigationGuard, RouteRecordRaw } from "vue-router";
import About from "../About.vue";
import Accounts from "../pages/accounts/Accounts.vue";
import AccountView from "../pages/accounts/AccountView.vue";
import Attachments from "../components/attachments/Attachments.vue";
import EmptyRoute from "../pages/EmptyRoute.vue";
import Home from "../Home.vue";
import Install from "../Install.vue";
import Locations from "../components/locations/Locations.vue";
import Login from "../pages/Login.vue";
import Security from "../Security.vue";
import Settings from "../pages/settings/Settings.vue";
import Tags from "../components/tags/Tags.vue";
import TransactionView from "../components/transactions/TransactionView.vue";
import { appTabs } from "../model/ui/tabs";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/authStore";

// See https://next.router.vuejs.org/guide/advanced/meta.html#typescript about adding types to the `meta` field

// type RouteTitleGetter = () => string;
// type RouteTitle = string | RouteTitleGetter;

// declare module "vue-router" {
// 	interface RouteMeta {
// 		title?: RouteTitle;
// 	}
// }

export const APP_ROOTS = appTabs //
	.map(tab => `/${tab}`)
	.concat(["/", "/about", "/security", "/install", "/login", "/signup"]);

const onlyIfLoggedIn: NavigationGuard = (from, to, next) => {
	const auth = useAuthStore();
	if (auth.uid !== null) {
		next();
	} else {
		next("/login");
	}
};

const accounts: RouteRecordRaw = {
	path: "/accounts",
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
	path: "/attachments",
	beforeEnter: onlyIfLoggedIn,
	component: Attachments,
};

const locations: RouteRecordRaw = {
	path: "/locations",
	beforeEnter: onlyIfLoggedIn,
	component: Locations,
};

const tags: RouteRecordRaw = {
	path: "/tags",
	beforeEnter: onlyIfLoggedIn,
	component: Tags,
};

const settings: RouteRecordRaw = {
	path: "/settings",
	beforeEnter: onlyIfLoggedIn,
	component: Settings,
};

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			component: Home,
		},
		{
			path: "/about",
			component: About,
		},
		{
			path: "/security",
			component: Security,
		},
		{
			path: "/install",
			component: Install,
		},
		{
			path: "/logout",
			component: EmptyRoute,
			async beforeEnter(to, from, next): Promise<void> {
				const auth = useAuthStore();
				await auth.logout();
				next("/login");
			},
		},
		{
			path: "/login",
			component: Login,
			beforeEnter(from, to, next): void {
				const auth = useAuthStore();
				if (auth.uid !== null) {
					next("/accounts");
				} else {
					next();
				}
			},
		},
		{
			path: "/signup",
			component: Login,
			beforeEnter(from, to, next): void {
				const auth = useAuthStore();
				if (auth.uid !== null) {
					next("/accounts");
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
