<script lang="ts">
	import { _ } from "svelte-i18n";
	import AppVersion from "./components/AppVersion.svelte";
	import GitHubIcon from "./icons/GitHub.svelte";
	import I18N from "./components/I18N.svelte";
	import OutLink from "./components/OutLink.svelte";
</script>

<footer class="footer-0696aa0e">
	<p><AppVersion /></p>
	<p>
		<I18N keypath="footer.license">
			<!-- name -->
			<OutLink
				to="https://github.com/AverageHelper/accountable-vue/blob/main/LICENSE"
				title={$_("footer.view-license")}>{$_("footer.license-name")}</OutLink
			>
		</I18N>
	</p>
	<p>
		<I18N keypath="footer.pr">
			<!-- issue -->
			<OutLink to="https://github.com/AverageHelper/accountable-vue/issues/new/choose"
				>{$_("footer.issue")}</OutLink
			>
			<!-- github -->
			<OutLink to="https://github.com/AverageHelper/accountable-vue">{$_("footer.github")}</OutLink>
		</I18N>
	</p>
	<p>
		<OutLink to="https://github.com/AverageHelper/accountable-vue" title={$_("footer.view-source")}>
			<GitHubIcon class="icon" alt={$_("footer.view-github")} title={$_("footer.view-github")} />
		</OutLink>
	</p>
</footer>

<style lang="scss" global>
	@use "styles/colors" as *;

	.footer-0696aa0e {
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

				.icon {
					color: color($label);
				}
			}
		}
	}
</style>
