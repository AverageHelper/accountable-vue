import type { Route } from "svelte-router-spa/types/components/router";
import { appTabs } from "../model/ui/tabs";
import { fetchSession, lockVault, logout, pKey, uid } from "../store/authStore";
import { get } from "svelte/store";
import About from "../About.svelte";
import Accounts from "../pages/accounts/Accounts.svelte";
import AccountView from "../pages/accounts/AccountView.svelte";
import Attachments from "../pages/attachments/Attachments.svelte";
import Home from "../Home.svelte";
import Install from "../Install.svelte";
import Locations from "../pages/locations/Locations.svelte";
import Locked from "../pages/auth/Locked.svelte";
import Login from "../pages/auth/Login.svelte";
import MonthView from "../pages/transactions/MonthView.svelte";
import NotFound from "../pages/NotFound.svelte";
import Security from "../Security.svelte";
import Settings from "../pages/settings/Settings.svelte";
import Tags from "../pages/tags/Tags.svelte";
import TransactionView from "../pages/transactions/TransactionView.svelte";
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

type RouteAssertion = Route["onlyIf"];

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

async function isVaultUnlocked(): Promise<boolean> {
	if (get(uid) === null) await fetchSession();
	return get(uid) !== null && get(pKey) !== null; // we have a uid and a pKey
}

async function isVaultLoggedInLocked(): Promise<boolean> {
	if (get(uid) === null) await fetchSession();
	return get(uid) !== null && !get(pKey); // we have a uid but no pKey
}

async function isVaultLoggedOut(): Promise<boolean> {
	if (get(uid) === null) await fetchSession();
	return get(uid) === null;
}

const vaultIsUnlocked: RouteAssertion = {
	guard: isVaultUnlocked,
	redirect: lockPath(), // if vault is locked or logged out, go to lockPath
};

const vaultIsLoggedOut: RouteAssertion = {
	guard: isVaultLoggedOut,
	redirect: accountsPath(), // if the vault is logged in, go home
};

const accounts: Route = {
	name: accountsPath(),
	onlyIf: vaultIsUnlocked,
	component: Accounts,
	nestedRoutes: [
		{
			name: ":accountId",
			component: AccountView,
			nestedRoutes: [
				{
					name: "months/:rawMonth",
					component: MonthView,
				},
				{
					name: "transactions/:transactionId",
					component: TransactionView,
				},
			],
		},
	],
};

const attachments: Route = {
	name: attachmentsPath(),
	onlyIf: vaultIsUnlocked,
	component: Attachments,
};

const locations: Route = {
	name: locationsPath(),
	onlyIf: vaultIsUnlocked,
	component: Locations,
};

const tags: Route = {
	name: tagsPath(),
	onlyIf: vaultIsUnlocked,
	component: Tags,
};

const settings: Route = {
	name: settingsPath(),
	onlyIf: vaultIsUnlocked,
	component: Settings,
};

export const routes: Array<Route> = [
	{
		name: homePath(),
		component: Home,
	},
	{
		name: aboutPath(),
		component: About,
	},
	{
		name: securityPath(),
		component: Security,
	},
	{
		name: installPath(),
		component: Install,
	},
	{
		name: logoutPath(),
		onlyIf: {
			async guard(): Promise<boolean> {
				await logout(); // make sure to log out before routing here
				return true;
			},
			redirect: loginPath(),
		},
		redirectTo: loginPath(),
	},
	{
		name: loginPath(),
		onlyIf: vaultIsLoggedOut,
		component: Login,
	},
	{
		name: lockPath(),
		onlyIf: {
			async guard(): Promise<boolean> {
				lockVault();
				// if vault is logged out, go to loginPath
				return await isVaultLoggedInLocked();
			},
			redirect: loginPath(),
		},
		component: Locked,
	},
	{
		name: signupPath(),
		onlyIf: vaultIsLoggedOut,
		component: Login,
	},
	accounts,
	attachments,
	locations,
	tags,
	settings,
	{
		name: "404",
		component: NotFound,
	},
];
