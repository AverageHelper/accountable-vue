<script lang="ts">
	import type { Account } from "../../model/Account";
	import type { Location, LocationRecordParams } from "../../model/Location";
	import type { Transaction, TransactionRecordParams } from "../../model/Transaction";
	import { _ } from "svelte-i18n";
	import { createEventDispatcher, onMount } from "svelte";
	import { equal, isNegative, isZero, toSnapshot } from "dinero.js";
	import { recordFromLocation } from "../../model/Location";
	import { transaction as newTransaction } from "../../model/Transaction";
	import { useLocationsStore, useTransactionsStore, useUiStore } from "../../store";
	import { zeroDinero } from "../../helpers/dineroHelpers";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import Checkbox from "../../components/inputs/Checkbox.svelte";
	import CheckmarkIcon from "../../icons/Checkmark.svelte";
	import ConfirmDestroyTransaction from "./ConfirmDestroyTransaction.svelte";
	import CurrencyInput from "../../components/inputs/CurrencyInput.svelte";
	import DateTimeInput from "../../components/inputs/DateTimeInput.svelte";
	import LocationField from "../locations/LocationField.svelte";
	import TextAreaField from "../../components/inputs/TextAreaField.svelte";
	import TextField from "../../components/inputs/TextField.svelte";
	import TrashIcon from "../../icons/Trash.svelte";

	const dispatch = createEventDispatcher<{
		deleted: void;
		finished: void;
	}>();

	export let account: Account;
	export let transaction: Transaction | null = null;

	const locations = useLocationsStore();
	const transactions = useTransactionsStore();
	const ui = useUiStore();

	$: ogTransaction = transaction;
	$: ogLocation =
		ogTransaction?.locationId !== null && ogTransaction?.locationId !== undefined
			? locations.items[ogTransaction.locationId] ?? null
			: null;
	$: isCreatingTransaction = ogTransaction === null;

	let isLoading = false;
	let title = "";
	let notes = "";
	let locationData: (LocationRecordParams & { id: string | null }) | null = null;
	let createdAt = new Date();
	let amount = zeroDinero;
	let isReconciled = false;

	let isAskingToDelete = false;
	$: isExpense = isNegative(amount) || isZero(amount);
	$: hasAttachments = (ogTransaction?.attachmentIds.length ?? 0) > 0;

	$: oldAmount = (ogTransaction?.amount ?? zeroDinero).toJSON();
	$: hasChanges = ogTransaction
		? createdAt !== (ogTransaction?.createdAt ?? new Date()) ||
		  title !== (ogTransaction?.title ?? "") ||
		  notes !== (ogTransaction?.notes ?? "") ||
		  amount.toJSON().amount !== oldAmount.amount ||
		  amount.toJSON().currency.code !== oldAmount.currency.code ||
		  isReconciled !== (ogTransaction?.isReconciled ?? false) ||
		  locationData?.title !== ogLocation?.title ||
		  locationData?.title !== ogLocation?.title ||
		  locationData?.subtitle !== ogLocation?.subtitle ||
		  locationData?.coordinate?.lat !== ogLocation?.coordinate?.lat ||
		  locationData?.coordinate?.lng !== ogLocation?.coordinate?.lng
		: title !== "" ||
		  notes !== "" ||
		  !equal(amount, zeroDinero) ||
		  isReconciled !== false ||
		  (locationData?.title ?? "") !== "" ||
		  (locationData?.subtitle ?? "") !== "" ||
		  (locationData?.coordinate?.lat ?? null) !== null ||
		  (locationData?.coordinate?.lng ?? null) !== null;

	createdAt.setSeconds(0, 0);

	onMount(() => {
		// Modal invocations call this. This is good.

		title = ogTransaction?.title ?? title;
		notes = ogTransaction?.notes ?? notes;
		createdAt = ogTransaction?.createdAt ?? createdAt;
		amount = ogTransaction?.amount ?? amount;
		isReconciled = ogTransaction?.isReconciled ?? isReconciled;

		const ogLocationId = ogTransaction?.locationId ?? null;
		if (ogLocationId !== null && ogLocationId) {
			const ogLocation = locations.items[ogLocationId];
			const ogRecord = ogLocation ? recordFromLocation(ogLocation) : null;
			locationData = ogRecord !== null ? { ...ogRecord, id: ogLocationId } : null;
		}
	});

	async function submit() {
		isLoading = true;

		try {
			if (!title.trim()) {
				throw new Error($_("error.form.missing-required-fields"));
			}

			// Handle location change (to another or to none)
			//  Unlink the old and delete it if unreferenced
			const ogLocationId = ogTransaction?.locationId ?? null;
			if (ogLocationId !== null) {
				// The next step will replace the location link
				// Just delete the location if this is the only transaction which references it
				const ogLocation = locations.items[ogLocationId];
				if (ogLocation) {
					const referenceCount = transactions.numberOfReferencesForLocation(ogLocation.id);
					if (referenceCount > 1) {
						await locations.deleteLocation(ogLocation);
					}
				}
			}

			// Handle location add
			//  Link the new location (if `id` isn't null), or make one
			let newLocation: Location | null = null;
			if (locationData) {
				if (locationData.id !== null) {
					// Existing location
					newLocation = locations.items[locationData.id] ?? null;
				} else {
					// New location
					newLocation = await locations.createLocation(locationData);
				}
			}

			const params: TransactionRecordParams = {
				title: title.trim(),
				notes: notes.trim(),
				createdAt: createdAt,
				isReconciled: isReconciled,
				locationId: newLocation?.id ?? null,
				amount: toSnapshot(amount),
				accountId: account.id,
				tagIds: ogTransaction?.tagIds ?? [],
				attachmentIds: ogTransaction?.attachmentIds ?? [],
			};
			if (ogTransaction === null) {
				await transactions.createTransaction(params);
			} else {
				await transactions.updateTransaction(newTransaction({ ...params, id: ogTransaction.id }));
			}

			dispatch("finished");
		} catch (error) {
			ui.handleError(error);
		}

		isLoading = false;
	}

	function askToDeleteTransaction(event: Event) {
		event.preventDefault();
		isAskingToDelete = true;
	}

	async function confirmDeleteTransaction() {
		isLoading = true;

		try {
			if (ogTransaction === null) {
				throw new Error("No account to delete"); // TODO: I18N
			}

			await transactions.deleteTransaction(ogTransaction);
			dispatch("deleted");
			dispatch("finished");
		} catch (error) {
			ui.handleError(error);
		}

		isLoading = false;
	}

	function cancelDeleteTransaction() {
		isAskingToDelete = false;
	}
</script>

<form class={isExpense ? "expense" : ""} on:submit|preventDefault={submit}>
	<!-- TODO: I18N -->
	{#if isCreatingTransaction}
		<h1>Create {isExpense ? "Expense" : "Income"}</h1>
	{:else}
		<h1>Edit {isExpense ? "Expense" : "Income"}</h1>
	{/if}

	<span>Account: {account.title ?? "Unknown"}</span>

	<DateTimeInput value={createdAt} label="date" on:input={e => (createdAt = e.detail)} />
	<div class="moneys">
		<CurrencyInput
			value={amount}
			class="currency"
			label="amount"
			on:input={e => (amount = e.detail)}
		/>
		<Checkbox
			value={isReconciled}
			class="reconciliation"
			label="Reconciled"
			on:change={e => (isReconciled = e.detail)}
		/>
	</div>
	<TextField
		value={title}
		label="title"
		placeholder="Bank Money"
		required
		on:input={e => (title = e.detail)}
	/>
	<LocationField value={locationData} on:change={e => (locationData = e.detail)} />
	<TextAreaField
		value={notes}
		label="notes"
		placeholder="This is a thing"
		on:input={e => (notes = e.detail)}
	/>

	<div class="buttons">
		<ActionButton type="submit" kind="bordered-primary" disabled={!hasChanges || isLoading}>
			<CheckmarkIcon /> Save</ActionButton
		>
		{#if !isCreatingTransaction && !hasAttachments}
			<ActionButton
				kind="bordered-destructive"
				disabled={isLoading}
				on:click={askToDeleteTransaction}
			>
				<TrashIcon /> Delete</ActionButton
			>
		{/if}
	</div>
	{#if isLoading}
		<p>Saving...</p>
	{/if}
	{#if hasAttachments}
		<p>You must delete attachments before you may delete this transaction.</p>
	{/if}

	{#if transaction}
		<ConfirmDestroyTransaction
			{transaction}
			isOpen={isAskingToDelete}
			on:yes={confirmDeleteTransaction}
			on:no={cancelDeleteTransaction}
		/>
	{/if}
</form>

<style type="text/scss">
	@use "styles/colors" as *;

	form {
		align-items: center;

		> label:not(.reconciliation) {
			width: 80%;
		}

		&.expense h1,
		&.expense .currency {
			color: color($red);
		}

		.moneys {
			display: flex;
			flex-flow: row nowrap;
			align-items: flex-end;
			width: 80%;

			.currency {
				flex: 1 0 auto; // Grow, don't shrink
			}

			.reconciliation {
				margin-bottom: 8pt;
				margin-left: 8pt;
			}
		}
	}

	.buttons {
		display: flex;
		flex-flow: row nowrap;
		width: 80%;

		:first-child {
			margin-right: auto;
		}
	}
</style>
