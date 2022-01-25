<script setup lang="ts">
import AppVersion from "./components/AppVersion.vue";
import GitHubIcon from "./icons/GitHub.vue";
</script>

<template>
	<footer>
		<p><AppVersion /></p>
		<p
			>This project is licensed under the
			<a
				href="https://github.com/AverageHelper/accountable-vue/blob/main/LICENSE"
				target="_blank"
				title="View the full license"
				>GNU General Public License v3.0</a
			>.</p
		>
		<p
			>Feel free to
			<a href="https://github.com/AverageHelper/accountable-vue/issues/new/choose" target="_blank"
				>open an issue</a
			>
			or submit a pull request on this project's
			<a href="https://github.com/AverageHelper/accountable-vue" target="_blank">GitHub page</a>.</p
		>
		<p>
			<a
				href="https://github.com/AverageHelper/accountable-vue"
				target="_blank"
				title="View this project's source code"
			>
				<GitHubIcon alt="Check out my GitHub" title="Check out my GitHub" />
			</a>
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
