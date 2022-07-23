<script lang="ts">
	import { _ } from "svelte-i18n";
	import Footer from "./Footer.svelte";
	import I18N from "./components/I18N.svelte";
	import OutLink from "./components/OutLink.svelte";
</script>

<main class="content">
	<h1 id="goals">{$_("about.goals.heading")}</h1>
	<I18N keypath="about.goals.p1" tag="p">
		<!-- selfhost -->
		<OutLink to="https://en.wikipedia.org/wiki/Self-hosting_(web_services)"
			>{$_("about.goals.selfhost")}</OutLink
		>
		<!-- opensource -->
		<OutLink to="https://en.wikipedia.org/wiki/Open-source_software"
			>{$_("about.goals.opensource")}</OutLink
		>
	</I18N>

	<h1 id="alternatives">{$_("about.alternatives.heading")}</h1>
	<I18N keypath="about.alternatives.p1" tag="p">
		<!-- alts -->
		<OutLink to="https://opensource.com/life/17/10/personal-finance-tools-linux"
			>{$_("about.alternatives.alts")}</OutLink
		>
	</I18N>
	<ul>
		<I18N keypath="about.alternatives.alt1" tag="li">
			<!-- ynab -->
			<OutLink to="https://www.youneedabudget.com">{$_("about.alternatives.ynab")}</OutLink>
		</I18N>

		<I18N keypath="about.alternatives.alt2" tag="li">
			<!-- intuit -->
			<OutLink to="https://www.intuit.com">{$_("about.alternatives.intuit")}</OutLink>
			<!-- mint -->
			<OutLink to="https://mint.intuit.com">{$_("about.alternatives.mint")}</OutLink>
			<!-- turbotax -->
			<OutLink to="https://turbotax.intuit.com">{$_("about.alternatives.turbotax")}</OutLink>
		</I18N>

		<I18N keypath="about.alternatives.alt3" tag="li">
			<!-- ramsey -->
			<OutLink to="https://www.ramseysolutions.com/">{$_("about.alternatives.ramsey")}</OutLink>
			<!-- everydollar -->
			<OutLink to="https://www.ramseysolutions.com/ramseyplus/everydollar"
				>{$_("about.alternatives.everydollar")}</OutLink
			>
		</I18N>

		<I18N keypath="about.alternatives.alt4" tag="li">
			<!-- others -->
			<OutLink to="https://www.nerdwallet.com/article/finance/best-budget-apps"
				>{$_("about.alternatives.others")}</OutLink
			>
		</I18N>
	</ul>

	<I18N keypath="about.alternatives.open-source" tag="p">
		<!-- opensource -->
		<OutLink to="https://en.wikipedia.org/wiki/Open-source_software"
			>{$_("about.alternatives.opensource")}</OutLink
		>
		<!-- e2ee -->
		<OutLink to="https://en.wikipedia.org/wiki/End-to-end_encryption"
			>{$_("about.alternatives.e2ee")}</OutLink
		>
	</I18N>
	<p>{$_("about.alternatives.summary")}</p>
	<!-- TODO: Reorganize. Mention https://www.budgetwithbuckets.com/ -->

	<Footer />
</main>

<style type="text/scss">
	ul li {
		margin-bottom: 16pt;
	}
</style>
