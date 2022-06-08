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
			<h1>Hosted Service</h1>
			<p
				>There's an Accountable client-server architecture right here! Click the
				<router-link :to="loginRoute">Login</router-link> link above to create an account.</p
			>
		</template>

		<h1>Self-host Server</h1>
		<p
			>Check out the
			<OutLink to="https://github.com/AverageHelper/accountable-vue/tree/main#setup"
				>README</OutLink
			>
			for more on how to set Accountable up on your own computer.<template v-if="!loginEnabled">
				We're planning a hosted solution right here soon.</template
			>
		</p>
		<p
			>Coming soon: Use Firebase as an Accountable server! Great if you're okay with using a Google
			service and don't want to pay to host your own installation.</p
		>

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
