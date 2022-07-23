<script lang="ts">
	import type { Transaction } from "../../model/Transaction";
	import { allBalances, attachments, handleError, updateTransaction } from "../../store";
	import { isNegative as isDineroNegative } from "dinero.js";
	import { intlFormat, toTimestamp } from "../../transformers";
	import { onMount } from "svelte";
	import { transaction as newTransaction } from "../../model/Transaction";
	import { transactionPath } from "../../router";
	import Checkbox from "../../components/inputs/Checkbox.svelte";
	import ListItem from "../../components/ListItem.svelte";
	import LocationIcon from "../../icons/Location.svelte";
	import PaperclipIcon from "../../icons/Paperclip.svelte";

	export let transaction: Transaction;

	let isChangingReconciled = false;
	$: isNegative = isDineroNegative(transaction.amount);
	$: hasAttachments = transaction.attachmentIds.length > 0;

	let isAttachmentBroken: boolean | "unknown" = "unknown";
	$: hasLocation = transaction.locationId !== null;
	$: timestamp = toTimestamp(transaction.createdAt);

	$: accountBalanceSoFar = ($allBalances[transaction.accountId] ?? {})[transaction.id] ?? null;

	$: transactionRoute = transactionPath(transaction.accountId, transaction.id);

	function seeIfAnyAttachmentsAreBroken() {
		if (isAttachmentBroken !== "unknown") return;
		const attachmentIds = transaction.attachmentIds;

		// Check if an attachment is broken
		for (const id of attachmentIds) {
			const file = $attachments[id];
			if (!file) {
				isAttachmentBroken = true;
				return;
			}
		}

		isAttachmentBroken = false;
	}

	onMount(() => {
		seeIfAnyAttachmentsAreBroken();
	});

	async function markReconciled(isReconciled: CustomEvent<boolean>) {
		isChangingReconciled = true;

		try {
			const newTxn = newTransaction(transaction);
			newTxn.isReconciled = isReconciled.detail;
			await updateTransaction(newTxn);
		} catch (error) {
			handleError(error);
		}

		isChangingReconciled = false;
	}
</script>

<ListItem
	to={transactionRoute}
	title={transaction.title ?? "--"}
	subtitle={timestamp}
	count={intlFormat(transaction.amount)}
	subCount={accountBalanceSoFar ? intlFormat(accountBalanceSoFar) : "--"}
	negative={isNegative}
>
	<div slot="icon" class="checkbox-b9eab07a">
		<Checkbox
			disabled={isChangingReconciled}
			class={isChangingReconciled ? "isChanging" : ""}
			value={transaction.isReconciled}
			on:change={markReconciled}
			on:click={e => {
				e.stopPropagation();
				e.preventDefault();
			}}
		/>
		{#if isChangingReconciled}
			<span class="loading" style="min-height: 33pt">...</span>
		{/if}
	</div>

	<div slot="aside" class="indicators-b9eab07a">
		{#if hasLocation}
			<div title={transaction.locationId ?? ""}>
				<LocationIcon />
			</div>
		{/if}
		<!-- TODO: I18N -->
		{#if hasAttachments}
			<div
				title={`${transaction.attachmentIds.length} attachment${
					transaction.attachmentIds.length === 1 ? "" : "s"
				}`}
			>
				{#if isAttachmentBroken}
					<strong>?</strong>
				{/if}
				<PaperclipIcon />
			</div>
		{/if}
	</div>
</ListItem>

<style lang="scss" global>
	@use "styles/colors" as *;

	.checkbox-b9eab07a {
		position: relative;

		.isChanging {
			opacity: 0;
		}

		.loading {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-75%, -35%);
		}
	}

	.indicators-b9eab07a {
		display: flex;
		flex-flow: row wrap;
		color: color($secondary-label);

		:not(:last-child) {
			margin-bottom: 2pt;
		}
	}
</style>
