<script setup lang="ts">
import type { Account } from "../../model/Account";
import type { Location, LocationRecordParams } from "../../model/Location";
import type { PropType } from "vue";
import type { TransactionRecordParams } from "../../model/Transaction";
import ActionButton from "../ActionButton.vue";
import Checkbox from "../Checkbox.vue";
import CheckmarkIcon from "../../icons/Checkmark.vue";
import ConfirmDestroyTransaction from "./ConfirmDestroyTransaction.vue";
import CurrencyInput from "../CurrencyInput.vue";
import DateTimeInput from "../DateTimeInput.vue";
import LocationField from "../locations/LocationField.vue";
import TextAreaField from "../TextAreaField.vue";
import TextField from "../TextField.vue";
import TrashIcon from "../../icons/Trash.vue";
import { dinero, isNegative, isZero, toSnapshot } from "dinero.js";
import { ref, computed, toRefs, onMounted } from "vue";
import { Transaction } from "../../model/Transaction";
import { USD } from "@dinero.js/currencies";
import { useToast } from "vue-toastification";
import { useLocationsStore, useTransactionsStore } from "../../store";

const emit = defineEmits(["deleted", "finished"]);

const props = defineProps({
	account: { type: Object as PropType<Account>, required: true },
	transaction: { type: Object as PropType<Transaction | null>, default: null },
});
const { account, transaction } = toRefs(props);

const locations = useLocationsStore();
const transactions = useTransactionsStore();
const toast = useToast();

const ogTransaction = computed(() => transaction.value as Transaction | null);
const isCreatingTransaction = computed(() => ogTransaction.value === null);

const isLoading = ref(false);
const title = ref("");
const notes = ref("");
const locationData = ref<(LocationRecordParams & { id: string | null }) | null>(null);
const createdAt = ref(new Date());
const amount = ref(dinero({ amount: 0, currency: USD }));
const isReconciled = ref(false);

const isAskingToDelete = ref(false);
const isExpense = computed(() => isNegative(amount.value) || isZero(amount.value));
const hasAttachments = computed(() => (ogTransaction.value?.attachmentIds.length ?? 0) > 0);

createdAt.value.setSeconds(0, 0);

onMounted(() => {
	// Opened, if we're modal
	title.value = ogTransaction.value?.title ?? title.value;
	notes.value = ogTransaction.value?.notes ?? notes.value;
	createdAt.value = ogTransaction.value?.createdAt ?? createdAt.value;
	amount.value = ogTransaction.value?.amount ?? amount.value;
	isReconciled.value = ogTransaction.value?.isReconciled ?? isReconciled.value;

	const ogLocationId = ogTransaction.value?.locationId ?? null;
	if (ogLocationId !== null && ogLocationId) {
		const ogLocation = locations.items[ogLocationId]?.toRecord() ?? null;
		locationData.value = ogLocation !== null ? { ...ogLocation, id: ogLocationId } : null;
	}
});

function handleError(error: unknown) {
	let message: string;
	if (error instanceof Error) {
		message = error.message;
	} else {
		message = JSON.stringify(error);
	}
	toast.error(message);
	console.error(error);
}

async function submit() {
	isLoading.value = true;

	try {
		if (!title.value.trim()) {
			throw new Error("Title is required");
		}

		// Handle location change (to another or to none)
		//  Unlink the old and delete it if unreferenced
		const ogLocationId = ogTransaction.value?.locationId ?? null;
		if (ogLocationId !== null) {
			// The next step will replace the location link
			// Just delete the location if this is the only transaction which referenced it
			const ogLocation = locations.items[ogLocationId];
			if (ogLocation) {
				await transactions.deleteLocationIfUnreferenced(ogLocation);
			}
		}

		// Handle location add
		//  Link the new location (if `id` isn't null), or make one
		let newLocation: Location | null = null;
		if (locationData.value) {
			if (locationData.value.id !== null) {
				// Existing location
				newLocation = locations.items[locationData.value.id] ?? null;
			} else {
				// New location
				newLocation = await locations.createLocation(locationData.value);
			}
		}

		const params: TransactionRecordParams = {
			title: title.value.trim(),
			notes: notes.value.trim(),
			createdAt: createdAt.value,
			isReconciled: isReconciled.value,
			locationId: newLocation?.id ?? null,
			amount: toSnapshot(amount.value),
			accountId: account.value.id,
			tagIds: ogTransaction.value?.tagIds ?? [],
			attachmentIds: ogTransaction.value?.attachmentIds ?? [],
		};
		if (ogTransaction.value === null) {
			await transactions.createTransaction(account.value, params);
		} else {
			await transactions.updateTransaction(
				new Transaction(account.value.id, ogTransaction.value.id, params)
			);
		}

		emit("finished");
	} catch (error: unknown) {
		handleError(error);
	}

	isLoading.value = false;
}

function askToDeleteTransaction() {
	isAskingToDelete.value = true;
}

async function confirmDeleteTransaction() {
	isLoading.value = true;

	try {
		if (ogTransaction.value === null) {
			throw new Error("No account to delete");
		}

		await transactions.deleteTransaction(ogTransaction.value);
		emit("deleted");
		emit("finished");
	} catch (error: unknown) {
		handleError(error);
	}

	isLoading.value = false;
}

function cancelDeleteTransaction() {
	isAskingToDelete.value = false;
}
</script>

<template>
	<form :class="{ expense: isExpense }" @submit.prevent="submit">
		<h1 v-if="isCreatingTransaction">Create {{ isExpense ? "Expense" : "Income" }}</h1>
		<h1 v-else>Edit {{ isExpense ? "Expense" : "Income" }}</h1>

		<span>Account: {{ account.title ?? "Unknown" }}</span>

		<DateTimeInput v-model="createdAt" label="date" />
		<div class="moneys">
			<CurrencyInput v-model="amount" class="currency" label="amount" />
			<Checkbox v-model="isReconciled" class="reconciliation" label="Reconciled" />
		</div>
		<TextField v-model="title" label="title" placeholder="Bank Money" required />
		<LocationField v-model="locationData" />
		<TextAreaField v-model="notes" label="notes" placeholder="This is a thing" />

		<div class="buttons">
			<ActionButton type="submit" kind="bordered-primary" :disabled="isLoading">
				<CheckmarkIcon /> Save</ActionButton
			>
			<ActionButton
				v-if="!isCreatingTransaction && !hasAttachments"
				kind="bordered-destructive"
				:disabled="isLoading"
				@click.prevent="askToDeleteTransaction"
			>
				<TrashIcon /> Delete</ActionButton
			>
		</div>
		<p v-if="isLoading">Saving...</p>
		<p v-if="hasAttachments">You must delete attachments before you may delete this transaction.</p>

		<ConfirmDestroyTransaction
			v-if="transaction"
			:transaction="transaction"
			:is-open="isAskingToDelete"
			@yes="confirmDeleteTransaction"
			@no="cancelDeleteTransaction"
		/>
	</form>
</template>

<style scoped lang="scss">
@use "styles/colors" as *;

form {
	align-items: center;

	> label:not(.reconciliation) {
		width: 80%;
	}

	&.expense,
	&.expense h1,
	&.expense .currency .text-input {
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
