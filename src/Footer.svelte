<script lang="ts">
	import { _ } from "svelte-i18n";
	import AppVersion from "./components/AppVersion.svelte";
	import GitHubIcon from "./icons/GitHub.svelte";
	import I18N from "./components/I18N.svelte";
	import OutLink from "./components/OutLink.svelte";
</script>

<footer>
	<p><AppVersion /></p>
	<I18N keypath="footer.license" tag="p">
		<OutLink
			slot="name"
			to="https://github.com/AverageHelper/accountable-vue/blob/main/LICENSE"
			title={$_("footer.view-license")}>{$_("footer.license-name")}</OutLink
		>
	</I18N>
	<I18N keypath="footer.pr" tag="p">
		<OutLink slot="issue" to="https://github.com/AverageHelper/accountable-vue/issues/new/choose"
			>{$_("footer.issue")}</OutLink
		>
		<OutLink slot="github" href="https://github.com/AverageHelper/accountable-vue"
			>{$_("footer.github")}</OutLink
		>
	</I18N>
	<p>
		<OutLink
			href="https://github.com/AverageHelper/accountable-vue"
			title={$_("footer.view-source")}
		>
			<GitHubIcon alt={$_("footer.view-github")} title={$_("footer.view-github")} />
		</OutLink>
	</p>
</footer>

<style type="text/scss">
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
