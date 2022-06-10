<script setup lang="ts">
import ActionButton from "./components/buttons/ActionButton.vue";
import Footer from "./Footer.vue";
import EncryptionIcon from "./icons/Lock.vue";
import LedgerIcon from "./icons/MoneyTower.vue";
import OpenSourceIcon from "./icons/IdeaBox.vue";
import { aboutPath, signupPath } from "./router";
import { computed } from "vue";

const aboutRoute = computed(() => aboutPath());
const signupRoute = computed(() => signupPath());

const isSignupEnabled = computed(() => import.meta.env.VITE_ENABLE_SIGNUP === "true");
</script>

<template>
	<main class="content">
		<h1 class="tagline">{{ $t("home.tagline") }}</h1>

		<!-- Get started now -->
		<section id="get-started">
			<router-link :to="aboutRoute">
				<ActionButton kind="bordered-secondary">{{ $t("common.learn-more") }}</ActionButton>
			</router-link>
			<router-link v-if="isSignupEnabled" :to="signupRoute">
				<ActionButton kind="bordered-primary-green">{{ $t("home.sign-up-now") }}</ActionButton>
			</router-link>
			<a v-else href="#" @click.prevent>
				<ActionButton kind="bordered-primary-green">{{ $t("home.coming-soon") }}</ActionButton>
			</a>
		</section>

		<!-- Your money, where it's been -->
		<section id="ledger">
			<LedgerIcon class="section-icon" />
			<h3>{{ $t("home.accountability.heading") }}</h3>
			<i18n-t keypath="home.accountability.p1" tag="p">
				<template #tool>
					<router-link :to="aboutRoute">{{ $t("home.accountability.tool") }}</router-link>
				</template>
			</i18n-t>
		</section>

		<!-- E2E Encrypted -->
		<section id="encrypted">
			<EncryptionIcon class="section-icon" />
			<h3>{{ $t("home.encrypted.heading") }}</h3>
			<i18n-t keypath="home.encrypted.p1" tag="p">
				<template #legal>
					<i18n-t keypath="home.encrypted.legal" tag="small">
						<template #not>
							<em>{{ $t("home.encrypted.not") }}</em>
						</template>
					</i18n-t>
				</template>
			</i18n-t>
		</section>

		<!-- Open-source and Free -->
		<section id="open-source">
			<OpenSourceIcon class="section-icon" />
			<h3>{{ $t("home.open-source.heading") }}</h3>
			<p>
				{{ $t("home.open-source.open") }}
				<br />
				{{ $t("home.open-source.let-me-know") }}
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
