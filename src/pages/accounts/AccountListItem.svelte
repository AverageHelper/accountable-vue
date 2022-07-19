<script lang="ts">
	import type { Account } from "../../model/Account";
	import { accountPath } from "../../router";
	import { intlFormat } from "../../transformers";
	import { isNegative as isDineroNegative } from "dinero.js";
	import { onMount } from "svelte";
	import { getTransactionsForAccount, transactionsForAccount, useAccountsStore } from "../../store";
	import ListItem from "../../components/ListItem.svelte";

	export let account: Account;
	export let link: boolean = true;
	export let count: number | null = null;

	const accounts = useAccountsStore();

	$: accountRoute = link ? accountPath(account.id) : "#"; // TODO: I18N
	$: theseTransactions = $transactionsForAccount[account.id];

	$: remainingBalance = accounts.currentBalance[account.id] ?? null;
	$: isBalanceNegative = remainingBalance !== null && isDineroNegative(remainingBalance);

	$: numberOfTransactions =
		theseTransactions === undefined
			? count ?? null
			: count ?? Object.keys(theseTransactions).length;

	$: notes = account.notes?.trim() ?? "";
	$: countString = `${numberOfTransactions ?? "?"} transaction${
		numberOfTransactions === 1 ? "" : "s"
	}`; // TODO: I18N
	$: subtitle = !notes
		? countString
		: numberOfTransactions === null
		? notes
		: `${countString} - ${notes}`;

	onMount(async () => {
		await getTransactionsForAccount(account);
	});
</script>

<ListItem
	to={accountRoute}
	title={account.title}
	{subtitle}
	count={remainingBalance ? intlFormat(remainingBalance) : "--"}
	negative={isBalanceNegative}
	class={$$props.class}
	on:click
/>
