<script setup lang="ts">
import ActionButton from "./components/buttons/ActionButton.vue";
import Footer from "./Footer.vue";
import EncryptionIcon from "./icons/Lock.vue";
import LedgerIcon from "./icons/MoneyTower.vue";
import OpenSourceIcon from "./icons/IdeaBox.vue";
</script>

<template>
	<main class="content">
		<h1 class="tagline">Respectful digital financial records.</h1>

		<!-- Get started now -->
		<section id="get-started">
			<router-link to="/about">
				<ActionButton kind="bordered-secondary">Learn More</ActionButton>
			</router-link>
			<router-link to="/signup">
				<ActionButton kind="bordered-primary-green">Get Started</ActionButton>
			</router-link>
		</section>

		<!-- Your money, where it's been -->
		<section id="ledger">
			<LedgerIcon class="section-icon" />
			<h3>Accountable To Yourself.</h3>
			<p
				>Keep a close eye on your spending. Never lose a dime again! If you're the sort to obsess
				about where your money is going,
				<router-link to="/about">this might be the tool for you</router-link>.</p
			>
		</section>

		<!-- E2E Encrypted -->
		<section id="encrypted">
			<EncryptionIcon class="section-icon" />
			<h3>Your Ledger, Not Mine.</h3>
			<p
				>Accountable, by design, cannot see your data, even on our own servers. We don't need or
				want to see what you do with your money. That's not my job.
				<small>(I'd rather you <em>not</em> do illegal stuff with this.)</small>
			</p>
		</section>

		<!-- Open-source and Free -->
		<section id="open-source">
			<OpenSourceIcon class="section-icon" />
			<h3>Keep Me Accountable.</h3>
			<p>
				All of Accountable's source code is open to read.
				<br />
				Let me know if anything needs fixed.
			</p>
		</section>

		<Footer />
	</main>
</template>

<style scoped lang="scss">
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
