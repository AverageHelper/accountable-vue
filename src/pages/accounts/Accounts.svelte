<script lang="ts">
	import { _ } from "svelte-i18n";
	import { onMount } from "svelte";
	import AccountEdit from "./AccountEdit.svelte";
	import AccountListItem from "./AccountListItem.svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import AddRecordListItem from "./AddRecordListItem.svelte";
	import ErrorNotice from "../../components/ErrorNotice.svelte";
	import List from "../../components/List.svelte";
	import Modal from "../../components/Modal.svelte";
	import NewLoginModal from "../../components/NewLoginModal.svelte";
	import ReloadIcon from "../../icons/Reload.svelte";
	import {
		useAccountsStore,
		useAttachmentsStore,
		useLocationsStore,
		useTagsStore,
	} from "../../store";

	const accounts = useAccountsStore();
	const attachments = useAttachmentsStore();
	const locations = useLocationsStore();
	const tags = useTagsStore();

	$: allAccounts = accounts.allAccounts;
	$: numberOfAccounts = accounts.numberOfAccounts;
	$: loadError = accounts.loadError;
	let isCreatingAccount = false;

	async function load() {
		console.debug("Starting watchers...");
		await Promise.all([
			accounts.watchAccounts(),
			attachments.watchAttachments(),
			locations.watchLocations(),
			tags.watchTags(),
		]);
	}

	onMount(async () => {
		await load();
	});

	function startCreatingAccount() {
		isCreatingAccount = true;
	}

	function finishCreatingAccount() {
		isCreatingAccount = false;
	}
</script>

<main class="content">
	<div class="heading">
		<h1>Accounts</h1>
	</div>

	<ErrorNotice error={loadError} />
	{#if loadError}
		<ActionButton on:click={load}>
			<ReloadIcon />
		</ActionButton>
	{:else}
		<List>
			<li>
				<AddRecordListItem noun="account" on:click={startCreatingAccount} />
			</li>
			{#each allAccounts as account (account.id)}
				<li>
					<AccountListItem {account} />
				</li>
			{/each}
			{#if numberOfAccounts > 0}
				<li>
					<p class="footer"
						>{$_c("common.count.account", numberOfAccounts, { n: numberOfAccounts })}</p
					>
				</li>
			{/if}
		</List>
	{/if}
</main>

<NewLoginModal />

<Modal open={isCreatingAccount} closeModal={finishCreatingAccount}>
	<AccountEdit on:finished={finishCreatingAccount} />
</Modal>

<style type="text/scss">
	@use "styles/colors" as *;

	.heading {
		max-width: 36em;
		margin: 1em auto;

		> h1 {
			margin: 0;
		}
	}

	.footer {
		color: color($secondary-label);
		user-select: none;
	}
</style>
