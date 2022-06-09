<script setup lang="ts">
import AppVersion from "./components/AppVersion.vue";
import GitHubIcon from "./icons/GitHub.vue";
import OutLink from "./components/OutLink.vue";
</script>

<template>
	<footer>
		<p><AppVersion /></p>
		<i18n-t keypath="footer.license" tag="p">
			<template #name>
				<OutLink
					to="https://github.com/AverageHelper/accountable-vue/blob/main/LICENSE"
					:title="$t('footer.view-license')"
					>{{ $t("footer.license-name") }}</OutLink
				>
			</template>
		</i18n-t>
		<i18n-t keypath="footer.pr" tag="p">
			<template #issue>
				<OutLink to="https://github.com/AverageHelper/accountable-vue/issues/new/choose">{{
					$t("footer.issue")
				}}</OutLink>
			</template>
			<template #github>
				<OutLink href="https://github.com/AverageHelper/accountable-vue">{{
					$t("footer.github")
				}}</OutLink>
			</template>
		</i18n-t>
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
