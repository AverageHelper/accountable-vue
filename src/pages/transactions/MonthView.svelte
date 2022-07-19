<script lang="ts">
	import { transactionsForAccountByMonth, useAccountsStore } from "../../store";
	import AddRecordListItem from "../accounts/AddRecordListItem.svelte";
	import List from "../../components/List.svelte";
	import TransactionCreateModal from "./TransactionCreateModal.svelte";
	import TransactionListItem from "./TransactionListItem.svelte";

	export let accountId: string;
	export let rawMonth: string;

	const accounts = useAccountsStore();

	let isEditingTransaction = false;

	$: month =
		// Perhaps validate with regex? Would have to match the locale tho
		decodeURIComponent(rawMonth);

	$: monthTransactions =
		month === null || !month ? [] : ($transactionsForAccountByMonth[accountId] ?? {})[month] ?? [];

	$: account = accounts.items[accountId] ?? null;

	function startCreatingTransaction() {
		isEditingTransaction = true;
	}

	function finishCreatingTransaction() {
		isEditingTransaction = false;
	}
</script>

<main class="content">
	<div class="heading">
		<div class="month-title">
			<h1>{month}</h1>
		</div>
	</div>

	{#if month}
		<List>
			<li>
				<AddRecordListItem on:click={startCreatingTransaction} />
			</li>
			{#each monthTransactions as transaction (transaction.id)}
				<li class="transaction">
					<TransactionListItem {transaction} />
				</li>
			{/each}
			<li>
				<p class="footer">
					<!-- TODO: I18N -->
					<span>{monthTransactions?.length ?? 0}</span>
					transaction{#if monthTransactions?.length !== 1}s{/if}
				</p>
			</li>
		</List>
	{:else}
		<p>{month} does not match a month identifier pattern</p>
	{/if}
</main>

{#if account}
	<TransactionCreateModal
		{account}
		isOpen={isEditingTransaction}
		closeModal={finishCreatingTransaction}
	/>
{/if}

<style type="text/scss">
	@use "styles/colors" as *;

	.heading {
		display: flex;
		flex-flow: row nowrap;
		align-items: baseline;
		max-width: 36em;
		margin: 1em auto;

		> .month-title {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;

			> h1 {
				margin: 0;
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
</style>
