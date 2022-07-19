<script lang="ts">
	import { intlFormat } from "../../transformers";
	import { isNegative as isDineroNegative } from "dinero.js";
	import { computed } from "vue";
	import { reverseChronologically } from "../../model/utility/sort";
	import { useAccountsStore, useTransactionsStore } from "../../store";
	import { useRoute, useRouter } from "vue-router";
	import { zeroDinero } from "../../helpers/dineroHelpers";
	import AccountEdit from "./AccountEdit.svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import AddRecordListItem from "./AddRecordListItem.svelte";
	import EditIcon from "../../icons/Edit.svelte";
	import Fuse from "fuse.js";
	import List from "../../components/List.svelte";
	import Modal from "../../components/Modal.svelte";
	import SearchBar from "../../components/SearchBar.svelte";
	import TransactionCreateModal from "../transactions/TransactionCreateModal.svelte";
	import TransactionMonthListItem from "../transactions/TransactionMonthListItem.svelte";
	import TransactionListItem from "../transactions/TransactionListItem.svelte";

	export let accountId: string;

	const route = useRoute();
	const router = useRouter();
	const accounts = useAccountsStore();
	const transactions = useTransactionsStore();

	let isEditingAccount = false;
	let isEditingTransaction = false;

	$: account = accounts.items[accountId] ?? null;
	$: theseTransactions = Object.values(transactions.transactionsForAccount[accountId] ?? {}).sort(
		reverseChronologically
	);

	const transactionMonths = computed(() => {
		const now = new Date();
		const months = transactions.months;
		return Object.entries(transactions.transactionsForAccountByMonth[accountId] ?? {}).sort(
			([monthId1], [monthId2]) => {
				// Look up the month's cached start date
				const a = months[monthId1];
				const b = months[monthId2];

				if (!a) console.warn(`Month ${monthId1} (a) doesn't exist in cache`);
				if (!b) console.warn(`Month ${monthId2} (b) doesn't exist in cache`);

				const aStart = a?.start ?? now;
				const bStart = b?.start ?? now;
				// Order reverse chronologically
				return bStart.getTime() - aStart.getTime();
			}
		);
	});

	$: searchClient = new Fuse(theseTransactions, { keys: ["title", "notes"] });
	$: searchQuery = (route.query["q"] ?? "").toString();
	$: filteredTransactions =
		searchQuery !== "" //
			? searchClient.search(searchQuery).map(r => r.item)
			: theseTransactions;

	$: remainingBalance = accounts.currentBalance[accountId] ?? null;
	$: isNegative = isDineroNegative(remainingBalance ?? zeroDinero);

	$: void transactions.watchTransactions(account);

	function goBack() {
		router.back();
	}

	function startCreatingTransaction() {
		isEditingTransaction = true;
	}

	function finishCreatingTransaction() {
		isEditingTransaction = false;
	}

	function startEditingAccount() {
		isEditingAccount = true;
	}

	function finishEditingAccount() {
		isEditingAccount = false;
	}
</script>

<main class="content">
	<div class="heading">
		<div class="account-title">
			<!-- TODO: I18N -->
			<h1>{account?.title || "Account"}</h1>
			<ActionButton class="edit" on:click={startEditingAccount}>
				<EditIcon />
			</ActionButton>
		</div>

		{#if remainingBalance === null}
			<p class="account-balance">--</p>
		{:else}
			<p class="account-balance {isNegative ? 'negative' : ''}">{intlFormat(remainingBalance)}</p>
		{/if}
	</div>

	<SearchBar class="search" />

	<!-- Search Results -->
	{#if searchQuery}
		<List class="transaction-months-list">
			{#each filteredTransactions as transaction (transaction.id)}
				<li class="transaction">
					<TransactionListItem {transaction} />
				</li>
			{/each}
			<li>
				<p class="footer">
					<span>{filteredTransactions.length}</span> of
					<span>{theseTransactions.length}</span>
					transaction{#if theseTransactions.length !== 1}s{/if}
				</p>
			</li>
		</List>

		<!-- Months (normal view) -->
	{:else}
		<List class="transaction-months-list">
			<li>
				<AddRecordListItem on:click={startCreatingTransaction} />
			</li>
			{#each Object.entries(transactionMonths) as [month, monthTransactions] (month)}
				<li>
					<TransactionMonthListItem
						{accountId}
						monthName={month}
						count={monthTransactions.length}
					/>
				</li>
			{/each}
		</List>
	{/if}
</main>

{#if account}
	<TransactionCreateModal
		{account}
		isOpen={isEditingTransaction}
		closeModal={finishCreatingTransaction}
	/>
	<Modal open={isEditingAccount} closeModal={finishEditingAccount}>
		<AccountEdit {account} on:deleted={goBack} on:finished={finishEditingAccount} />
	</Modal>
{/if}

<style type="text/scss">
	@use "styles/colors" as *;

	.heading {
		display: flex;
		flex-flow: row nowrap;
		align-items: baseline;
		max-width: 36em;
		margin: 1em auto;

		> .account-title {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;

			> h1 {
				margin: 0;
			}

			.edit {
				display: flex;
				flex-flow: row nowrap;
				align-items: center;
				color: color($link);
				min-height: 22pt;
				height: 22pt;
				min-width: 22pt;
				width: 22pt;
				margin-left: 8pt;

				.icon {
					height: 14pt;
				}
			}
		}

		.account-balance {
			margin: 0;
			margin-left: auto;
			text-align: right;
			font-weight: bold;
			padding-right: 0.7em;

			&.negative {
				color: color($red);
			}
		}
	}

	.search {
		max-width: 36em;
		margin: 1em auto;
	}

	.transaction-months-list {
		.footer {
			padding-top: 0.5em;
			user-select: none;
			color: color($secondary-label);
		}
	}
</style>
