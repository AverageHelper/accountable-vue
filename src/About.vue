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
			<i18n-t keypath="about.alternatives.alt1" tag="li">
				<template #ynab>
					<OutLink to="https://www.youneedabudget.com">{{ $t("about.alternatives.ynab") }}</OutLink>
				</template>
			</i18n-t>

			<i18n-t keypath="about.alternatives.alt2" tag="li">
				<template #intuit>
					<OutLink to="https://www.intuit.com">{{ $t("about.alternatives.intuit") }}</OutLink>
				</template>
				<template #mint>
					<OutLink to="https://mint.intuit.com">{{ $t("about.alternatives.mint") }}</OutLink>
				</template>
				<template #turbotax>
					<OutLink to="https://turbotax.intuit.com">{{
						$t("about.alternatives.turbotax")
					}}</OutLink>
				</template>
			</i18n-t>

			<i18n-t keypath="about.alternatives.alt3" tag="li">
				<template #ramsey>
					<OutLink to="https://www.ramseysolutions.com/">{{
						$t("about.alternatives.ramsey")
					}}</OutLink>
				</template>
				<template #everydollar>
					<OutLink to="https://www.ramseysolutions.com/ramseyplus/everydollar">{{
						$t("about.alternatives.everydollar")
					}}</OutLink>
				</template>
			</i18n-t>

			<i18n-t keypath="about.alternatives.alt4" tag="li">
				<template #others>
					<OutLink to="https://www.nerdwallet.com/article/finance/best-budget-apps">{{
						$t("about.alternatives.others")
					}}</OutLink>
				</template>
			</i18n-t>
		</ul>

		<i18n-t keypath="about.alternatives.open-source" tag="p">
			<template #opensource>
				<OutLink to="https://en.wikipedia.org/wiki/Open-source_software">{{
					$t("about.alternatives.opensource")
				}}</OutLink>
			</template>
			<template #e2ee>
				<OutLink to="https://en.wikipedia.org/wiki/End-to-end_encryption">{{
					$t("about.alternatives.e2ee")
				}}</OutLink>
			</template>
		</i18n-t>
		<i18n-t keypath="about.alternatives.summary" tag="p" />
		<!-- TODO: Reorganize. Mention https://www.budgetwithbuckets.com/ -->

		<Footer />
	</main>
</template>

<style scoped lang="scss">
ul li {
	margin-bottom: 16pt;
}
</style>
