import type { NavigationGuard, RouteRecordRaw } from "vue-router";
import Accounts from "../components/accounts/Accounts.vue";
import AccountView from "../components/accounts/AccountView.vue";
import Attachments from "../components/attachments/Attachments.vue";
import EmptyRoute from "../components/EmptyRoute.vue";
import Home from "../Home.vue";
import Locations from "../components/locations/Locations.vue";
import Login from "../components/Login.vue";
import Settings from "../components/settings/Settings.vue";
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
	.concat(["/", "/login"]);

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
			// redirect: "/login",
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
		accounts,
		attachments,
		locations,
		tags,
		settings,
	],
});
