<script setup lang="ts">
import AppVersion from "./components/AppVersion.vue";
import GitHubIcon from "./icons/GitHub.vue";
import OutLink from "./components/OutLink.vue";
</script>

<template>
	<footer>
		<p><AppVersion /></p>
		<p
			>This project is licensed under the
			<OutLink
				to="https://github.com/AverageHelper/accountable-vue/blob/main/LICENSE"
				title="View the full license"
				>GNU General Public License v3.0</OutLink
			>.</p
		>
		<p
			>Feel free to
			<OutLink to="https://github.com/AverageHelper/accountable-vue/issues/new/choose"
				>open an issue</OutLink
			>
			or submit a pull request on this project's
			<OutLink href="https://github.com/AverageHelper/accountable-vue">GitHub page</OutLink>.</p
		>
		<p>
			<OutLink
				href="https://github.com/AverageHelper/accountable-vue"
				title="View this project's source code"
			>
				<GitHubIcon alt="Check out my GitHub" title="Check out my GitHub" />
			</OutLink>
		</p>
	</footer>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 16pt 0;
	margin-top: 48pt;

	p {
		color: color($secondary-label);
		text-align: center;

		a {
			font-weight: bold;

			> .icon {
				color: color($label);
			}
		}
	}
}
</style>
