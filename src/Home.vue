<script setup lang="ts">
import ActionButton from "./components/ActionButton.vue";
import Footer from "./Footer.vue";
import EncryptionIcon from "./icons/Lock.vue";
import LedgerIcon from "./icons/MoneyTower.vue";
import OpenSourceIcon from "./icons/IdeaBox.vue";
</script>

<template>
	<main class="content">
		<p class="tagline">Free, open-source, respectful digital financial records.</p>

		<!-- Get started now -->
		<section id="get-started">
			<router-link to="/about">
				<ActionButton kind="bordered-secondary">Learn More</ActionButton>
			</router-link>
			<router-link to="/login">
				<ActionButton kind="bordered-primary">Get Started</ActionButton>
			</router-link>
		</section>

		<!-- Your money, where it's been, in your pocket -->
		<section id="ledger">
			<LedgerIcon class="section-icon" />
			<h1>Keep Yourself Accountable</h1>
			<p>Keep a close eye on your spending.</p>
			<p
				>If you're the sort to be obsessive about where your money is going, this might be the tool
				for you.</p
			>
		</section>

		<!-- E2E Encrypted -->
		<section id="encrypted">
			<EncryptionIcon class="section-icon" />
			<h1>Your Ledger, Not Mine.</h1>
			<p
				>Accountable, by design, cannot see your data, even on our own servers. We don't need or
				want to see what you do with your money. That's not my job.</p
			>
			<p>I'd rather you didn't do illegal stuff with this. (I shouldn't have to say that, wow.)</p>
		</section>

		<!-- Open-source and Free -->
		<section id="open-source">
			<OpenSourceIcon class="section-icon" />
			<h1>Keep Me Accountable</h1>
			<p>Always open-source, free to host yourself</p>
			<ul>
				<li>You can see everything Accountable does on our GitHub page.</li>
				<li>Open-source, with a copy-left license.</li>
			</ul>
		</section>

		<Footer />
	</main>
</template>

<style scoped lang="scss">
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
