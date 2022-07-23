<script lang="ts">
	import { _ } from "svelte-i18n";
	import { aboutPath, signupPath } from "./router";
	import { isSignupEnabled } from "./store";
	import { Link } from "svelte-navigator";
	import ActionButton from "./components/buttons/ActionButton.svelte";
	import EncryptionIcon from "./icons/Lock.svelte";
	import Footer from "./Footer.svelte";
	import I18N from "./components/I18N.svelte";
	import LedgerIcon from "./icons/MoneyTower.svelte";
	import NopLink from "./components/NopLink.svelte";
	import OpenSourceIcon from "./icons/IdeaBox.svelte";

	const aboutRoute = aboutPath();
	const signupRoute = signupPath();
</script>

<main class="content main-a0571b9a">
	<h1 class="tagline">{$_("home.tagline")}</h1>

	<!-- Get started now -->
	<section id="get-started">
		<Link to={aboutRoute}>
			<ActionButton kind="bordered-secondary">{$_("common.learn-more")}</ActionButton>
		</Link>
		{#if isSignupEnabled}
			<Link to={signupRoute}>
				<ActionButton kind="bordered-primary-green">{$_("home.sign-up-now")}</ActionButton>
			</Link>
		{:else}
			<NopLink>
				<ActionButton kind="bordered-primary-green">{$_("home.coming-soon")}</ActionButton>
			</NopLink>
		{/if}
	</section>

	<!-- Your money, where it's been -->
	<section id="ledger">
		<LedgerIcon class="section-icon" />
		<h3>{$_("home.accountability.heading")}</h3>
		<p>
			<I18N keypath="home.accountability.p1">
				<!-- tool -->
				<Link to={aboutRoute}>{$_("home.accountability.tool")}</Link>
			</I18N>
		</p>
	</section>

	<!-- E2E Encrypted -->
	<section id="encrypted">
		<EncryptionIcon class="section-icon" />
		<h3>{$_("home.encrypted.heading")}</h3>
		<p>
			<I18N keypath="home.encrypted.p1">
				<!-- legal -->
				<small>
					<I18N keypath="home.encrypted.legal">
						<!-- not -->
						<em>{$_("home.encrypted.not")}</em>
					</I18N>
				</small>
			</I18N>
		</p>
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

<style lang="scss" global>
	@use "styles/setup" as *;

	.main-a0571b9a {
		.tagline {
			text-align: center;
		}

		p {
			text-align: left;
		}

		section {
			margin-top: 36pt;

			> .section-icon {
				float: right;
				margin-left: 24pt;
				margin-bottom: 24pt;
			}

			@include mq($until: mobile) {
				> .section-icon {
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

				> a {
					text-decoration: none;

					&:first-of-type {
						margin-right: 8pt;
					}
				}
			}
		}
	}
</style>
