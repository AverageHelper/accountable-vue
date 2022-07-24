<script lang="ts">
	import type RouteParams from "svelte-navigator/types/RouteParam";
	import { Router, Route } from "svelte-navigator";
	import About from "../About.svelte";
	import Accounts from "../pages/accounts/Accounts.svelte";
	import AccountView from "../pages/accounts/AccountView.svelte";
	import Attachments from "../pages/attachments/Attachments.svelte";
	import Home from "../Home.svelte";
	import Install from "../Install.svelte";
	import Locations from "../pages/locations/Locations.svelte";
	import Lock from "./guards/Lock.svelte";
	import Locked from "../pages/auth/Locked.svelte";
	import Login from "../pages/auth/Login.svelte";
	import Logout from "./guards/Logout.svelte";
	import MonthView from "../pages/transactions/MonthView.svelte";
	import Navbar from "../components/Navbar.svelte";
	import NotFound from "../pages/NotFound.svelte";
	import Redirect from "./guards/Redirect.svelte";
	import Security from "../Security.svelte";
	import Settings from "../pages/settings/Settings.svelte";
	import Tags from "../pages/tags/Tags.svelte";
	import TransactionView from "../pages/transactions/TransactionView.svelte";
	import VaultIsLoggedOut from "./guards/VaultIsLoggedOut.svelte";
	import VaultIsUnlocked from "./guards/VaultIsUnlocked.svelte";
	import {
		aboutPath,
		accountPath,
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

	function paramValue(params: RouteParams, key: string): string {
		return params[key] as string;
	}

	// This has something to do with SSR
	export let url = "";
</script>

<!-- TODO: Router should probably manage focus. Set primary to true when we're prepared to let it -->
<Router {url} primary={false}>
	<Navbar />

	<!-- Root -->
	<Route path={homePath()}>
		<Home />
	</Route>
	<Route path={aboutPath()}>
		<About />
	</Route>
	<Route path={securityPath()}>
		<Security />
	</Route>
	<Route path={installPath()}>
		<Install />
	</Route>
	<Route path={logoutPath()}>
		<Logout />
	</Route>
	<Route path={loginPath()}>
		<VaultIsLoggedOut>
			<Login />
		</VaultIsLoggedOut>
	</Route>
	<Route path={lockPath()}>
		<Lock>
			<Locked />
		</Lock>
	</Route>
	<Route path={signupPath()}>
		<VaultIsLoggedOut>
			<Login />
		</VaultIsLoggedOut>
	</Route>

	<!-- Accounts -->
	<Route path="{accountsPath()}/*">
		<Route path="/">
			<VaultIsUnlocked>
				<Accounts />
			</VaultIsUnlocked>
		</Route>

		<Route path=":accountId/*" let:params={accountParams}>
			<Route path="/">
				<VaultIsUnlocked>
					<AccountView accountId={paramValue(accountParams, "accountId")} />
				</VaultIsUnlocked>
			</Route>

			<Route path="months/*">
				<Route path="/">
					<Redirect to={accountPath(paramValue(accountParams, "accountId"))} />
				</Route>

				<Route path=":rawMonth" let:params={monthParams}>
					<VaultIsUnlocked>
						<MonthView
							accountId={paramValue(accountParams, "accountId")}
							rawMonth={paramValue(monthParams, "rawMonth")}
						/>
					</VaultIsUnlocked>
				</Route>
			</Route>

			<Route path="transactions/*">
				<Route path="/">
					<Redirect to={accountPath(paramValue(accountParams, "accountId"))} />
				</Route>

				<Route path=":transactionId" let:params={transactionParams}>
					<VaultIsUnlocked>
						<TransactionView
							accountId={paramValue(accountParams, "accountId")}
							transactionId={paramValue(transactionParams, "transactionId")}
						/>
					</VaultIsUnlocked>
				</Route>
			</Route>
		</Route>
	</Route>

	<!-- Attachments -->
	<Route path={attachmentsPath()}>
		<VaultIsUnlocked>
			<Attachments />
		</VaultIsUnlocked>
	</Route>

	<!-- Locations -->
	<Route path={locationsPath()}>
		<VaultIsUnlocked>
			<Locations />
		</VaultIsUnlocked>
	</Route>

	<!-- Tags -->
	<Route path={tagsPath()}>
		<VaultIsUnlocked>
			<Tags />
		</VaultIsUnlocked>
	</Route>

	<!-- Settings -->
	<Route path={settingsPath()}>
		<VaultIsUnlocked>
			<Settings />
		</VaultIsUnlocked>
	</Route>

	<!-- 404 -->
	<Route path="\*">
		<NotFound />
	</Route>
</Router>
