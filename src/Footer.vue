<script setup lang="ts">
import AppVersion from "./components/AppVersion.vue";
import GitHubIcon from "./icons/GitHub.vue";
import OutLink from "./components/OutLink.vue";
</script>

<template>
	<footer>
		<p><AppVersion /></p>
		<p
			>{{ $t("footer.license.preamble") }}
			<OutLink
				to="https://github.com/AverageHelper/accountable-vue/blob/main/LICENSE"
				:title="$t('footer.license.view-license')"
				>{{ $t("footer.license.name") }}</OutLink
			>.</p
		>
		<p
			>{{ $t("footer.pr.start") }}
			<OutLink to="https://github.com/AverageHelper/accountable-vue/issues/new/choose">{{
				$t("footer.pr.open-issue")
			}}</OutLink>
			{{ $t("footer.pr.submit-pr") }}
			<OutLink href="https://github.com/AverageHelper/accountable-vue">{{
				$t("footer.pr.github-page")
			}}</OutLink
			>.</p
		>
		<p>
			<OutLink
				href="https://github.com/AverageHelper/accountable-vue"
				:title="$t('footer.view-source')"
			>
				<GitHubIcon :alt="$t('footer.view-github')" :title="$t('footer.view-github')" />
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
