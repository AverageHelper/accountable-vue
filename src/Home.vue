<script setup lang="ts">
import ActionButton from "./components/ActionButton.vue";
import Footer from "./Footer.vue";
</script>

<template>
	<main class="content">
		<p class="tagline">Free, open-source, respectful digital financial records.</p>

		<!-- Get started now -->
		<div class="get-started">
			<router-link to="/about">
				<ActionButton kind="bordered-secondary">Learn More</ActionButton>
			</router-link>
			<router-link to="/login">
				<ActionButton kind="bordered-primary">Get Started</ActionButton>
			</router-link>
		</div>

		<!-- Your money, where it's been, in your pocket -->
		<section>
			<h1>Keep Yourself Accountable</h1>
			<p
				>Everything Accountable does is encrypted end-to-end. The server knows nothing about who you
				are.</p
			>
			<p
				>If you're the sort to be obsessive about where your money is going, this might be the tool
				for you.</p
			>
		</section>

		<!-- E2E Encrypted -->
		<section>
			<h1>Security</h1>
			<p
				>Accountable, by design, cannot see your data, even on our own servers. We don't need or
				want to see what you do with your money, that's not our job.</p
			>
		</section>

		<!-- Open-source and Free -->
		<section>
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
section {
	margin-top: 32pt;
}

.tagline {
	text-align: center;
}

.get-started {
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
</style>
