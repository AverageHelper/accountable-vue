<script setup lang="ts">
import ExternalLink from "./components/ExternalLink.vue";
import Footer from "./Footer.vue";
</script>

<template>
	<main class="content">
		<h1 id="goals">Goals</h1>
		<p
			>The aim of Accountable is to be a cross-platform and portable spot to keep your transaction
			records and receipts. I plan to have proper mobile clients eventually. The
			<ExternalLink to="https://en.wikipedia.org/wiki/Self-hosting_(web_services)"
				>self-host</ExternalLink
			>
			option will always be available, and I intend for this project to always be
			<ExternalLink to="https://en.wikipedia.org/wiki/Open-source_software"
				>open-source</ExternalLink
			>. You will always have access to the financial records that you give to Accountable, and
			Accountable cannot share those records with anyone else.</p
		>

		<h1 id="alternatives">Alternatives</h1>
		<p
			>There are a few
			<ExternalLink to="https://opensource.com/life/17/10/personal-finance-tools-linux"
				>open-source desktop balance keepers</ExternalLink
			>
			out there, but none I've found that I like. Feel free to use them if you'd like. I'm not
			sponsored by any of them. Their respective names are trademarks of their owners.</p
		>
		<ul>
			<li
				>You may have heard of
				<ExternalLink to="https://www.youneedabudget.com">YNAB</ExternalLink>.</li
			>
			<li>
				<ExternalLink to="https://www.intuit.com">Intuit</ExternalLink> makes
				<ExternalLink to="https://mint.intuit.com">Mint</ExternalLink>. These guys also make
				<ExternalLink to="https://turbotax.intuit.com">TurboTax</ExternalLink> and other fintech
				products you might have heard about.</li
			>
			<li>
				<ExternalLink to="https://www.ramseysolutions.com/">Dave Ramsey</ExternalLink> makes
				<ExternalLink to="https://www.ramseysolutions.com/ramseyplus/everydollar"
					>EveryDollar</ExternalLink
				>. I subscribe to many of Ramsey's financial principles. Stay out of debt, folks.</li
			>
			<li
				>There are
				<ExternalLink to="https://www.nerdwallet.com/article/finance/best-budget-apps"
					>lots of others</ExternalLink
				>, but I've only tried these. Check them out if you're curious! I'm sure they're great.</li
			>
		</ul>
		<p
			>I'm sure these are brilliant, but none of them are
			<ExternalLink to="https://en.wikipedia.org/wiki/Open-source_software"
				>open-source</ExternalLink
			>. All of these keep your data for you, and hang onto the encryption keys to that data;
			they're not
			<ExternalLink to="https://en.wikipedia.org/wiki/End-to-end_encryption"
				>end-to-end encrypted</ExternalLink
			>. I don't know what all they do with your data, and I don't trust them to tell you.</p
		>
		<p
			>Part of their business model is to be the gateway to your financial records. If you just want
			help with your budget, and want someone else to keep your pocketbook for you, then any of the
			above may suit you just fine.</p
		>

		<Footer />
	</main>
</template>
