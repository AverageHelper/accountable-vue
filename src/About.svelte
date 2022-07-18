<script lang="ts">
	import { _ } from "svelte-i18n";
	import Footer from "./Footer.svelte";
	import I18N from "./components/I18N.svelte";
	import OutLink from "./components/OutLink.svelte";
</script>

<main class="content">
	<h1 id="goals">{$_("about.goals.heading")}</h1>
	<I18N keypath="about.goals.p1" tag="p">
		<OutLink slot="selfhost" to="https://en.wikipedia.org/wiki/Self-hosting_(web_services)"
			>{$_("about.goals.selfhost")}</OutLink
		>
		<OutLink slot="opensource" to="https://en.wikipedia.org/wiki/Open-source_software"
			>{$_("about.goals.opensource")}</OutLink
		>
	</I18N>

	<h1 id="alternatives">{$_("about.alternatives.heading")}</h1>
	<I18N keypath="about.alternatives.p1" tag="p">
		<OutLink slot="alts" to="https://opensource.com/life/17/10/personal-finance-tools-linux"
			>{$_("about.alternatives.alts")}</OutLink
		>
	</I18N>
	<ul>
		<I18N keypath="about.alternatives.alt1" tag="li">
			<OutLink slot="ynab" to="https://www.youneedabudget.com"
				>{$_("about.alternatives.ynab")}</OutLink
			>
		</I18N>

		<I18N keypath="about.alternatives.alt2" tag="li">
			<OutLink slot="intuit" to="https://www.intuit.com">{$_("about.alternatives.intuit")}</OutLink>
			<OutLink slot="mint" to="https://mint.intuit.com">{$_("about.alternatives.mint")}</OutLink>
			<OutLink slot="turbotax" to="https://turbotax.intuit.com"
				>{$_("about.alternatives.turbotax")}</OutLink
			>
		</I18N>

		<I18N keypath="about.alternatives.alt3" tag="li">
			<OutLink slot="ramsey" to="https://www.ramseysolutions.com/"
				>{$_("about.alternatives.ramsey")}</OutLink
			>
			<OutLink slot="everydollar" to="https://www.ramseysolutions.com/ramseyplus/everydollar"
				>{$_("about.alternatives.everydollar")}</OutLink
			>
		</I18N>

		<I18N keypath="about.alternatives.alt4" tag="li">
			<OutLink slot="others" to="https://www.nerdwallet.com/article/finance/best-budget-apps"
				>{$_("about.alternatives.others")}</OutLink
			>
		</I18N>
	</ul>

	<I18N keypath="about.alternatives.open-source" tag="p">
		<OutLink slot="opensource" to="https://en.wikipedia.org/wiki/Open-source_software"
			>{$_("about.alternatives.opensource")}</OutLink
		>
		<OutLink slot="e2ee" to="https://en.wikipedia.org/wiki/End-to-end_encryption"
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
