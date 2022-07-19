<script lang="ts">
	import { _ } from "svelte-i18n";
	import { createEventDispatcher } from "svelte";
	import { useAuthStore } from "../store";
	import ActionButton from "./buttons/ActionButton.svelte";
	import Confirm from "./Confirm.svelte";
	import I18N from "./I18N.svelte";

	const dispatch = createEventDispatcher<{
		yes: void;
		no: void;
	}>();

	export let isOpen: boolean;

	const auth = useAuthStore();

	$: accountId = auth.accountId;

	function no() {
		dispatch("no");
	}

	function yes() {
		dispatch("yes");
	}
</script>

<Confirm {isOpen} closeModal={no}>
	<I18N slot="message" keypath="login.new-account.is-account-id-safe" tag="span">
		<code slot="accountId">{accountId}</code>
	</I18N>

	<ActionButton slot="primary-action" kind="bordered-primary" on:click={yes}
		>{$_("common.yes")}</ActionButton
	>
	<ActionButton slot="cancel-action" kind="bordered-secondary" on:click={no}
		>{$_("common.not-yet")}</ActionButton
	>
</Confirm>
