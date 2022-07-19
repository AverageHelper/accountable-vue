<script lang="ts">
	import { transactionsByMonth } from "../../router";
	import ListItem from "../../components/ListItem.svelte";
	import MonthIcon from "../../icons/Month.svelte";

	export let accountId: string;
	export let monthName: string;
	export let count: number;

	$: monthRoute = transactionsByMonth(accountId, encodeURIComponent(monthName));
</script>

<!-- TODO: I18N -->
<ListItem to={monthRoute} title={monthName} subtitle={`${count} transactions`}>
	<MonthIcon slot="icon" />
</ListItem>

<style type="text/scss">
	@use "styles/colors" as *;

	.icon {
		margin: 4pt;
	}

	.list-item {
		cursor: pointer;
	}
</style>
