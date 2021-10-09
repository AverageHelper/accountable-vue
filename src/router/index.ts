import type { NavigationGuard } from "vue-router";
import Accounts from "../components/Accounts.vue";
import AccountView from "../components/AccountView.vue";
import EmptyRoute from "../components/EmptyRoute.vue";
import Login from "../components/Login.vue";
import Settings from "../components/Settings.vue";
import TransactionView from "../components/TransactionView.vue";
import { createRouter, createWebHistory, useRoute } from "vue-router";
import { useAccountsStore, useTransactionsStore } from "../store";
import { useAuthStore } from "../store/authStore";

// See https://next.router.vuejs.org/guide/advanced/meta.html#typescript about adding types to the `meta` field

type RouteTitleGetter = () => string;
type RouteTitle = string | RouteTitleGetter;

declare module "vue-router" {
	interface RouteMeta {
		title?: RouteTitle;
	}
}

export const APP_ROOTS = ["/accounts", "/login"];

const onlyIfLoggedIn: NavigationGuard = (from, to, next) => {
	const auth = useAuthStore();
	if (auth.uid !== null) {
		next();
	} else {
		next("/login");
	}
};

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			redirect: "/login",
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
			meta: { title: "Login" },
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
			path: "/settings",
			beforeEnter: onlyIfLoggedIn,
			component: Settings,
			meta: { title: "Settings" },
		},
		{
			path: "/accounts",
			beforeEnter: onlyIfLoggedIn,
			component: Accounts,
			meta: { title: "Accounts" },
		},
		{
			path: "/accounts/:accountId",
			beforeEnter: onlyIfLoggedIn,
			component: AccountView,
			props: true,
			meta: {
				title(): string {
					const accounts = useAccountsStore();
					const route = useRoute();
					const accountId = route.params["accountId"] as string | undefined;
					const DEFAULT = "Unknown Account";
					if (accountId !== undefined) {
						return (accounts.items[accountId]?.title ?? DEFAULT) || DEFAULT;
					}
					return DEFAULT;
				},
			},
		},
		{
			path: "/accounts/:accountId/transactions/:transactionId",
			beforeEnter: onlyIfLoggedIn,
			component: TransactionView,
			props: true,
			meta: {
				title(): string {
					const transactions = useTransactionsStore();
					const route = useRoute();
					const accountId = route.params["accountId"] as string | undefined;
					const transactionId = route.params["transactionId"] as string | undefined;
					const DEFAULT = "Unknown Transaction";
					if (accountId !== undefined && transactionId !== undefined) {
						const theseTransactions = transactions.transactionsForAccount[accountId];
						if (theseTransactions !== undefined) {
							return (theseTransactions[transactionId]?.title ?? DEFAULT) || DEFAULT;
						}
					}
					return DEFAULT;
				},
			},
		},
	],
});
