<script lang="ts">
	import { _ } from "svelte-i18n";
	import { loginPath } from "./router";
	import { useAuthStore } from "./store";
	import Footer from "./Footer.svelte";
	import I18N from "./components/I18N.svelte";
	import OutLink from "./components/OutLink.svelte";

	const auth = useAuthStore();

	const loginEnabled = auth.isLoginEnabled;
	const loginRoute = loginPath();
</script>

<main class="content">
	{#if loginEnabled}
		<h1>{$_("install.service.heading")}</h1>
		<I18N keypath="install.service.p1" tag="p">
			<router-link slot="login" to={loginRoute}>{$_("home.nav.log-in")}</router-link>
		</I18N>
	{/if}

	<h1>{$_("install.self.heading")}</h1>
	<p>
		<I18N keypath="install.self.p1" tag="span">
			<OutLink slot="readme" to="https://github.com/AverageHelper/accountable-vue/tree/main#setup"
				>{$_("install.self.readme")}</OutLink
			>
		</I18N>
		{#if !loginEnabled}&nbsp;{$_("install.self.planning")}{/if}
	</p>
	<p>{$_("install.self.p2")}</p>

	<Footer />
</main>

<style type="text/scss">
	@use "styles/colors" as *;

	section {
		border: 1pt solid color($separator);
		border-radius: 4pt;
		margin: 0 auto;
		padding: 8pt 16pt;
		width: fit-content;

		h2 {
			margin: 0;
			text-align: center;
		}

		ul {
			margin: 0;
		}
	}
</style>
