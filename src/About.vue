<script setup lang="ts">
import Footer from "./Footer.vue";
import OutLink from "./components/OutLink.vue";
</script>

<template>
	<main class="content">
		<h1 id="goals">{{ $t("about.goals.heading") }}</h1>
		<i18n-t keypath="about.goals.p1" tag="p">
			<template #selfhost>
				<OutLink to="https://en.wikipedia.org/wiki/Self-hosting_(web_services)">{{
					$t("about.goals.selfhost")
				}}</OutLink>
			</template>
			<template #opensource>
				<OutLink to="https://en.wikipedia.org/wiki/Open-source_software">{{
					$t("about.goals.opensource")
				}}</OutLink>
			</template>
		</i18n-t>

		<h1 id="alternatives">{{ $t("about.alternatives.heading") }}</h1>
		<i18n-t keypath="about.alternatives.p1" tag="p">
			<template #alts>
				<OutLink to="https://opensource.com/life/17/10/personal-finance-tools-linux">{{
					$t("about.alternatives.alts")
				}}</OutLink>
			</template>
		</i18n-t>
		<ul>
			<li>You may have heard of <OutLink to="https://www.youneedabudget.com">YNAB</OutLink>.</li>
			<li>
				<OutLink to="https://www.intuit.com">Intuit</OutLink> makes
				<OutLink to="https://mint.intuit.com">Mint</OutLink>. These guys also make
				<OutLink to="https://turbotax.intuit.com">TurboTax</OutLink> and other fintech products you
				might have heard about.</li
			>
			<li>
				<OutLink to="https://www.ramseysolutions.com/">Dave Ramsey</OutLink> makes
				<OutLink to="https://www.ramseysolutions.com/ramseyplus/everydollar">EveryDollar</OutLink>.
				I subscribe to many of Ramsey's financial principles. Stay out of debt, folks.</li
			>
			<li
				>There are
				<OutLink to="https://www.nerdwallet.com/article/finance/best-budget-apps"
					>lots of others</OutLink
				>, but I've only tried these. Check them out if you're curious! I'm sure they're great.</li
			>
		</ul>
		<p
			>I'm sure these are brilliant, but none of them are
			<OutLink to="https://en.wikipedia.org/wiki/Open-source_software">open-source</OutLink>. All of
			these keep your data for you, and hang onto the encryption keys to that data; they're not
			<OutLink to="https://en.wikipedia.org/wiki/End-to-end_encryption"
				>end-to-end encrypted</OutLink
			>. I don't know what all they do with your data, and I don't trust them to tell you.</p
		>
		<p
			>Part of their business model is to be the gateway to your financial records. If you just want
			help with your budget, and want someone else to keep your pocketbook for you, then any of the
			above may suit you just fine.</p
		>
		<!-- TODO: Reorganize. Mention https://www.budgetwithbuckets.com/ -->

		<Footer />
	</main>
</template>

<style scoped lang="scss">
ul li {
	margin-bottom: 16pt;
}
</style>
