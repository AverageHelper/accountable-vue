<script lang="ts">
	import type { Account } from "../../model/Account";
	import type { DatabaseSchema } from "../../model/DatabaseSchema";
	import type { Entry } from "@zip.js/zip.js";
	import { account as newAccount } from "../../model/Account";
	import { createEventDispatcher, tick } from "svelte";
	import { toast } from "@zerodevx/svelte-toast";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import AccountListItem from "../../pages/accounts/AccountListItem.svelte";
	import Checkmark from "../../icons/Checkmark.svelte";
	import List from "../../components/List.svelte";
	import Modal from "../../components/Modal.svelte";
	import {
		allAccounts as storedAccounts,
		handleError,
		importAccount,
		importAttachments,
		importLocations,
		importTags,
	} from "../../store";

	const dispatch = createEventDispatcher<{
		finished: void;
	}>();

	export let fileName: string = "";
	export let zip: Array<Entry> | null = null;
	export let db: DatabaseSchema | null = null;

	let accountIdsToImport = new Set<string>();
	$: numberOfAttachmentsToImport = db?.attachments?.length ?? 0;
	$: numberOfLocationsToImport = db?.locations?.length ?? 0;
	$: numberOfTagsToImport = db?.tags?.length ?? 0;

	let isImporting = false;
	let itemsImported = 0;

	function numberOfTransactionsToImport(): number {
		let count = 0;
		accountIdsToImport.forEach(a => {
			count += transactionCounts.value[a] ?? 0;
		});
		return count;
	}
	$: totalItemsToImport =
		numberOfTransactionsToImport() +
		numberOfTagsToImport +
		numberOfLocationsToImport +
		numberOfAttachmentsToImport +
		accountIdsToImport.size;

	$: importProgress =
		totalItemsToImport === 0 //
			? 1
			: itemsImported / totalItemsToImport;
	$: importProgressPercent = Intl.NumberFormat(undefined, { style: "percent" }) //
		.format(importProgress);

	$: hasDb = db !== null;
	$: importedAccounts = (db?.accounts ?? []) //
		.map(acct => newAccount({ ...acct, notes: acct.notes ?? null }));

	$: duplicateAccounts = importedAccounts //
		.filter(a1 => $storedAccounts.some(a2 => a2.id === a1.id));

	$: newAccounts = importedAccounts //
		.filter(a1 => !$storedAccounts.some(a2 => a2.id === a1.id));

	let transactionCounts: Record<string, number> = {};
	$: (db?.accounts ?? []).forEach(a => {
		transactionCounts[a.id] = (a.transactions ?? []).length;
	});

	$: if (hasDb && importedAccounts.length === 0) {
		toast.push(`${fileName || "That file"} contains no financial data.`); // TODO: I18N
		forgetDb();
	}

	function toggleAccount(event: Event, account: Account) {
		event.preventDefault();
		if (isImporting) return; // Don't modify import while we're importing

		if (accountIdsToImport.has(account.id)) {
			accountIdsToImport.delete(account.id);
		} else {
			accountIdsToImport.add(account.id);
		}
		accountIdsToImport = accountIdsToImport; // mark for reaction
	}

	function forgetDb() {
		if (!isImporting) {
			dispatch("finished");
		}
	}

	// TODO: Analyze the consequenses of this import. Will this overwrite some entries, and add other ones?
	async function beginImport(event: Event) {
		event.preventDefault();
		if (!db) return;
		isImporting = true;
		itemsImported = 0;

		try {
			for (const accountId of accountIdsToImport) {
				const accountToImport = db.accounts?.find(a => a.id === accountId);
				if (!accountToImport) continue;
				await importAccount(accountToImport);

				itemsImported += transactionCounts.value[accountToImport.id] ?? 0;
				itemsImported += 1;
				await tick();
			}

			await importLocations(db.locations ?? []);
			itemsImported += numberOfLocationsToImport;
			await tick();

			await importTags(db.tags ?? []);
			itemsImported += numberOfTagsToImport;
			await tick();

			await importAttachments(db.attachments ?? [], zip);
			itemsImported += numberOfAttachmentsToImport;
			await tick();

			toast.push("Imported all the things!", { classes: ["toast-success"] }); // TODO: I18N
			dispatch("finished");
		} catch (error) {
			handleError(error);
		}

		isImporting = false;
	}
</script>

<Modal open={hasDb} closeModal={forgetDb}>
	<!-- TODO: I18N -->
	<h1>Select Accounts from &quot;{fileName}&quot;</h1>

	{#if newAccounts.length > 0}
		<div>
			<h4>New Accounts</h4>
			<List>
				{#each newAccounts as account (account.id)}
					<li class="importable">
						<AccountListItem
							class="account"
							{account}
							link={false}
							count={transactionCounts[account.id] ?? 0}
							on:click={e => toggleAccount(e, account)}
						/>
						{#if accountIdsToImport.has(account.id)}
							<Checkmark />
						{/if}
					</li>
				{/each}
			</List>
		</div>
	{/if}

	{#if duplicateAccounts.length > 0}
		<div>
			<h4>Duplicate Accounts</h4>
			<p
				>These entries seem to match an account you already have. Would you like to overwrite the
				account and transactions we have stored with what you gave us here?</p
			>
			<List>
				{#each duplicateAccounts as account (account.id)}
					<li class="importable">
						<AccountListItem
							class="account"
							{account}
							link={false}
							count={transactionCounts[account.id] ?? 0}
							on:click={e => toggleAccount(e, account)}
						/>
						{#if accountIdsToImport.has(account.id)}
							<Checkmark />
						{/if}
					</li>
				{/each}
			</List>
		</div>
	{/if}

	<div>
		<h4>Everything Else</h4>
		<List>
			<li class="importable">{numberOfLocationsToImport} locations <Checkmark /></li>
			<li class="importable">{numberOfTagsToImport} tags <Checkmark /></li>
			<li class="importable">{numberOfAttachmentsToImport} attachments <Checkmark /></li>
		</List>
	</div>

	<div class="buttons">
		<ActionButton
			class="continue"
			kind="bordered-primary"
			disabled={isImporting || accountIdsToImport.size === 0}
			on:click={beginImport}
		>
			{#if isImporting}
				<span>Importing... ({importProgressPercent})</span>
			{:else}
				<span>Begin Import</span>
			{/if}
		</ActionButton>
	</div>
</Modal>

<style type="text/scss">
	@use "styles/colors" as *;

	.importable {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;

		.account {
			width: 100%;
		}

		.icon {
			margin-left: 8pt;
		}
	}

	.buttons {
		display: flex;
		flex-flow: row wrap;

		:not(:last-child) {
			margin-right: 8pt;
		}

		.continue {
			margin-left: auto;
		}
	}
</style>
