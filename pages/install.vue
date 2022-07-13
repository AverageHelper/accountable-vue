<script setup lang="ts">
import Footer from "./Footer.vue";
import OutLink from "./components/OutLink.vue";
import { computed } from "vue";
import { loginPath } from "./router";

const loginEnabled = computed(() => import.meta.env.VITE_ENABLE_LOGIN === "true");
const loginRoute = computed(() => loginPath());
</script>

<template>
	<main class="content">
		<template v-if="loginEnabled">
			<h1>{{ $t("install.service.heading") }}</h1>
			<i18n-t keypath="install.service.p1" tag="p">
				<template #login>
					<NuxtLink :to="loginRoute">{{ $t("home.nav.log-in") }}</NuxtLink>
				</template>
			</i18n-t>
		</template>

		<h1>{{ $t("install.self.heading") }}</h1>
		<p>
			<i18n-t keypath="install.self.p1">
				<template #readme>
					<OutLink to="https://github.com/AverageHelper/accountable-vue/tree/main#setup">{{
						$t("install.self.readme")
					}}</OutLink>
				</template>
			</i18n-t>
			<template v-if="!loginEnabled">&nbsp;{{ $t("install.self.planning") }}</template>
		</p>
		<i18n-t keypath="install.self.p2" tag="p" />

		<Footer />
	</main>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

section {
	border: 1pt solid color($separator);
	border-radius: 4pt;
	margin: 0 auto;
	padding: 8pt 16pt;
	width: fit-content;

	h2 {
		margin: 0;
		text-align: center;
	}

	ul {
		margin: 0;
	}
}
</style>
