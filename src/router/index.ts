import { createRouter, createWebHistory, useRoute } from "vue-router";
import Accounts from "../components/Accounts.vue";
import AccountView from "../components/AccountView.vue";
import { useAccountsStore } from "../store";

// See https://next.router.vuejs.org/guide/advanced/meta.html#typescript about adding types to the `meta` field

type RouteTitleGetter = () => string;
type RouteTitle = string | RouteTitleGetter;

declare module "vue-router" {
	interface RouteMeta {
		title: RouteTitle;
	}
}

export const APP_ROOT = "/accounts";

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			redirect: "/accounts",
		},
		{
			path: "/accounts",
			component: Accounts,
			meta: { title: "Accounts" },
		},
		{
			path: "/accounts/:accountId",
			component: AccountView,
			props: true,
			meta: {
				title(): string {
					const accounts = useAccountsStore();
					const route = useRoute();
					const accountId = route.params["accountId"] as string | undefined;
					const DEFAULT = "Account";
					if (accountId !== undefined) {
						return (accounts.items[accountId]?.title ?? DEFAULT) || DEFAULT;
					}
					return DEFAULT;
				},
			},
		},
	],
});
