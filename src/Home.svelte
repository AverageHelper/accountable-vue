<script lang="ts">
	import { _ } from "svelte-i18n";
	import { aboutPath, signupPath } from "./router";
	import { useAuthStore } from "./store";
	import ActionButton from "./components/buttons/ActionButton.svelte";
	import EncryptionIcon from "./icons/Lock.svelte";
	import Footer from "./Footer.svelte";
	import I18N from "./components/I18N.svelte";
	import LedgerIcon from "./icons/MoneyTower.svelte";
	import OpenSourceIcon from "./icons/IdeaBox.svelte";

	const aboutRoute = aboutPath();
	const signupRoute = signupPath();

	const auth = useAuthStore();

	const isSignupEnabled = auth.isSignupEnabled;
</script>

<main class="content">
	<h1 class="tagline">{$_("home.tagline")}</h1>

	<!-- Get started now -->
	<section id="get-started">
		<router-link to={aboutRoute}>
			<ActionButton kind="bordered-secondary">{$_("common.learn-more")}</ActionButton>
		</router-link>
		{#if isSignupEnabled}
			<router-link to={signupRoute}>
				<ActionButton kind="bordered-primary-green">{$_("home.sign-up-now")}</ActionButton>
			</router-link>
		{:else}
			<a href="#" on:click|preventDefault>
				<ActionButton kind="bordered-primary-green">{$_("home.coming-soon")}</ActionButton>
			</a>
		{/if}
	</section>

	<!-- Your money, where it's been -->
	<section id="ledger">
		<LedgerIcon class="section-icon" />
		<h3>{$_("home.accountability.heading")}</h3>
		<I18N keypath="home.accountability.p1" tag="p">
			<router-link slot="tool" to={aboutRoute}>{$_("home.accountability.tool")}</router-link>
		</I18N>
	</section>

	<!-- E2E Encrypted -->
	<section id="encrypted">
		<EncryptionIcon class="section-icon" />
		<h3>{$_("home.encrypted.heading")}</h3>
		<I18N keypath="home.encrypted.p1" tag="p">
			<I18N slot="legal" keypath="home.encrypted.legal" tag="small">
				<em slot="not">{$_("home.encrypted.not")}</em>
			</I18N>
		</I18N>
	</section>

	<!-- Open-source and Free -->
	<section id="open-source">
		<OpenSourceIcon class="section-icon" />
		<h3>{$_("home.open-source.heading")}</h3>
		<p>
			{$_("home.open-source.open")}
			<br />
			{$_("home.open-source.let-me-know")}
		</p>
	</section>

	<Footer />
</main>

<style type="text/scss">
	@use "styles/setup" as *;

	.tagline {
		text-align: center;
	}

	p {
		text-align: left;
	}

	section {
		margin-top: 36pt;

		.section-icon {
			float: right;
			margin-left: 24pt;
			margin-bottom: 24pt;
		}

		@include mq($until: mobile) {
			.section-icon {
				float: initial;
				margin: 24pt auto;
				margin-top: 0;
			}
		}

		&#get-started {
			display: flex;
			flex-flow: row nowrap;
			width: fit-content;
			margin: 0 auto;

			a {
				text-decoration: none;

				&:not(:first-of-type) {
					margin-left: 8pt;
				}
			}
		}
	}
</style>
