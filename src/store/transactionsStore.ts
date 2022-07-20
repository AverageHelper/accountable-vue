import type { Account } from "../model/Account";
import type { Dinero } from "dinero.js";
import type { Location } from "../model/Location";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import type { TransactionRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { TransactionSchema } from "../model/DatabaseSchema";
import type { Tag } from "../model/Tag";
import { add, subtract } from "dinero.js";
import { chronologically, reverseChronologically } from "../model/utility/sort";
import { derived, get, writable } from "svelte/store";
import { getDekMaterial, pKey } from "./authStore";
import { getDocs } from "../transport/index.js";
import { handleError, updateUserStats } from "./uiStore";
import { stores } from "./stores";
import { useAccountsStore } from "./accountsStore";
import { zeroDinero } from "../helpers/dineroHelpers";
import chunk from "lodash/chunk";
import groupBy from "lodash/groupBy";
import {
	recordFromTransaction,
	removeAttachmentIdFromTransaction,
	removeTagFromTransaction as _removeTagFromTransaction,
	transaction,
} from "../model/Transaction";
import {
	getTransactionsForAccount as _getTransactionsForAccount,
	createTransaction as _createTransaction,
	deriveDEK,
	updateTransaction as _updateTransaction,
	deleteTransaction as _deleteTransaction,
	transactionFromSnapshot,
	transactionsCollection,
	watchAllRecords,
	writeBatch,
} from "../transport";

interface Month {
	/** The date at which the month begins */
	start: Date;

	/** The month's short identifier */
	id: string;
}

export const transactionsForAccount = writable<Record<string, Record<string, Transaction>>>({}); // Account.id -> Transaction.id -> Transaction
export const transactionsForAccountByMonth = writable<
	Record<string, Record<string, Array<Transaction>>>
>({}); // Account.id -> month -> Transaction[]
export const months = writable<Record<string, Month>>({});
export const transactionsWatchers = writable<Record<string, Unsubscribe>>({}); // Transaction.id -> Unsubscribe

// WARN: Does not care about accounts
export const allTransactions = derived(transactionsForAccount, $transactionsForAccount => {
	const result: Record<string, Transaction> = {};

	Object.values($transactionsForAccount).forEach(transactions => {
		Object.values(transactions).forEach(transaction => {
			result[transaction.id] ??= transaction;
		});
	});

	return Object.values(result); // should be 2486
});

// WARN: Does not care about accounts
export const sortedTransactions = derived(allTransactions, $allTransactions => {
	return $allTransactions //
		.slice()
		.sort(chronologically);
});

export const allBalances = derived(sortedTransactions, $sortedTransactions => {
	const accounts = useAccountsStore();
	const balancesByAccount: Record<string, Record<string, Dinero<number>>> = {};

	// Consider each account...
	for (const accountId of accounts.allAccounts.map(a => a.id)) {
		const balances: Record<string, Dinero<number>> = {}; // Txn.id -> amount

		// Go through each transaction once, counting the account's balance as we go...
		let previous: Transaction | null = null;
		for (const transaction of $sortedTransactions.filter(t => t.accountId === accountId)) {
			const amount = transaction.amount;
			const previousBalance = previous ? balances[previous.id] ?? zeroDinero : zeroDinero;

			// balance so far == current + previous balance so far
			balances[transaction.id] = add(amount, previousBalance);
			previous = transaction;
		}

		balancesByAccount[accountId] = balances;
	}
	return balancesByAccount;
});

export function clearTransactionsCache(): void {
	Object.values(get(transactionsWatchers)).forEach(unsubscribe => unsubscribe());
	transactionsWatchers.set({});
	transactionsForAccount.set({});
	transactionsForAccountByMonth.set({});
	months.set({});
	console.debug("transactionsStore: cache cleared");
}

export async function watchTransactions(account: Account, force: boolean = false): Promise<void> {
	if (get(transactionsWatchers)[account.id] && !force) return;

	const watcher = get(transactionsWatchers)[account.id];
	if (watcher) {
		watcher();
		transactionsWatchers.update(transactionsWatchers => {
			const copy = { ...transactionsWatchers };
			delete copy[account.id];
			return copy;
		});
	}

	// Clear the known balance, the watcher will set it right
	const accounts = useAccountsStore();
	delete accounts.currentBalance[account.id];

	// Get decryption key ready
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key");
	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	// Watch the collection
	const collection = transactionsCollection();
	transactionsWatchers.update(_transactionsWatchers => {
		const copy = { ..._transactionsWatchers };
		copy[account.id] = watchAllRecords(
			collection,
			snap => {
				// Clear derived cache
				transactionsForAccountByMonth.update(transactionsForAccountByMonth => {
					const copy = { ...transactionsForAccountByMonth };
					delete copy[account.id];
					return copy;
				});

				// Update cache
				snap.docChanges().forEach(change => {
					const accountTransactions = get(transactionsForAccount)[account.id] ?? {};
					let currentBalance = accounts.currentBalance[account.id] ?? zeroDinero;

					try {
						switch (change.type) {
							case "removed":
								// Update the account's balance total
								currentBalance = subtract(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? zeroDinero
								);
								// Forget this transaction
								delete accountTransactions[change.doc.id];
								break;

							case "added": {
								// Add this transaction
								const transaction = transactionFromSnapshot(change.doc, dek);
								if (transaction.accountId !== account.id) break;
								accountTransactions[change.doc.id] = transaction;
								// Update the account's balance total
								currentBalance = add(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? zeroDinero
								);
								break;
							}

							case "modified": {
								// Remove this account's balance total
								currentBalance = subtract(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? zeroDinero
								);
								// Update this transaction
								const transaction = transactionFromSnapshot(change.doc, dek);
								if (transaction.accountId !== account.id) break;
								accountTransactions[change.doc.id] = transaction;
								// Update this account's balance total
								currentBalance = add(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? zeroDinero
								);
								break;
							}
						}

						accounts.currentBalance[account.id] = currentBalance;
						transactionsForAccount.update(transactionsForAccount => {
							const copy = { ...transactionsForAccount };
							copy[account.id] = accountTransactions;
							return copy;
						});
					} catch (error) {
						handleError(error);
					}
				});

				// Derive cache
				const _months: Record<string, Month> = {};
				const groupedTransactions = groupBy(
					get(transactionsForAccount)[account.id] ?? {},
					transaction => {
						const month: Month = {
							start: new Date(
								transaction.createdAt.getFullYear(),
								transaction.createdAt.getMonth()
							),
							id: transaction.createdAt.toLocaleDateString(undefined, {
								month: "short",
								year: "numeric",
							}),
						};
						_months[month.id] = month; // cache the month short ID with its sortable date
						return month.id;
					}
				);
				for (const month of Object.keys(groupedTransactions)) {
					// Sort each transaction list
					groupedTransactions[month]?.sort(reverseChronologically);
				}
				months.set(_months); // save months before we save transactions, so components know how to sort things
				transactionsForAccountByMonth.update(transactionsForAccountByMonth => {
					const copy = { ...transactionsForAccountByMonth };
					copy[account.id] = groupedTransactions;
					return copy;
				});
			},
			error => {
				console.error(error);
				const watcher = get(transactionsWatchers)[account.id];
				if (watcher) watcher();
				transactionsWatchers.update(transactionsWatchers => {
					const copy = { ...transactionsWatchers };
					delete copy[account.id];
					return copy;
				});
			}
		);
		return copy;
	});
}

export async function getTransactionsForAccount(account: Account): Promise<void> {
	const accounts = useAccountsStore();
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	const transactions = await _getTransactionsForAccount(account, dek);
	const totalBalance: Dinero<number> = Object.values(transactions).reduce(
		(balance, transaction) => {
			return add(balance, transaction.amount);
		},
		zeroDinero
	);

	transactionsForAccount.update(transactionsForAccount => {
		const copy = { ...transactionsForAccount };
		copy[account.id] = transactions;
		return copy;
	});
	accounts.currentBalance[account.id] = totalBalance;
}

export async function getAllTransactions(): Promise<void> {
	const { accounts } = await stores();
	for (const account of accounts.allAccounts) {
		await getTransactionsForAccount(account);
	}
}

export function tagIsReferenced(tagId: string): boolean {
	for (const transaction of get(allTransactions)) {
		if (transaction.tagIds.includes(tagId)) {
			// This tag is referenced
			return true;
		}
	}

	return false;
}

export function locationIsReferenced(locationId: string): boolean {
	for (const transaction of get(allTransactions)) {
		if (transaction.locationId === locationId) {
			// This location is referenced
			return true;
		}
	}

	return false;
}

export function numberOfReferencesForTag(tagId: string | undefined): number {
	if (tagId === undefined) return 0;
	let count = 0;

	get(allTransactions).forEach(transaction => {
		if (transaction.tagIds.includes(tagId)) {
			count += 1;
		}
	});

	return count;
}

export function numberOfReferencesForLocation(locationId: string | undefined): number {
	if (locationId === undefined) return 0;
	let count = 0;

	get(allTransactions).forEach(transaction => {
		if (transaction.locationId === locationId) {
			count += 1;
		}
	});

	return count;
}

export async function createTransaction(
	record: TransactionRecordParams,
	batch?: WriteBatch
): Promise<Transaction> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	const transaction = await _createTransaction(record, dek, batch);
	if (!batch) await updateUserStats();
	return transaction;
}

export async function updateTransaction(
	transaction: Transaction,
	batch?: WriteBatch
): Promise<void> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	await _updateTransaction(transaction, dek, batch);
	if (!batch) await updateUserStats();
}

export async function deleteTransaction(
	transaction: Transaction,
	batch?: WriteBatch
): Promise<void> {
	await _deleteTransaction(transaction, batch);
	if (!batch) await updateUserStats();
}

export async function deleteAllTransactions(): Promise<void> {
	for (const transactions of chunk(get(allTransactions), 500)) {
		const batch = writeBatch();
		await Promise.all(transactions.map(t => deleteTransaction(t, batch)));
		await batch.commit();
	}
}

export async function removeTagFromTransaction(
	tag: Tag,
	transaction: Transaction,
	batch?: WriteBatch
): Promise<void> {
	_removeTagFromTransaction(transaction, tag);
	await updateTransaction(transaction, batch);
}

export async function removeTagFromAllTransactions(tag: Tag): Promise<void> {
	// for each transaction that has this tag, remove the tag
	const relevantTransactions = get(allTransactions).filter(t => t.tagIds.includes(tag.id));
	for (const transactions of chunk(relevantTransactions, 500)) {
		const batch = writeBatch();
		await Promise.all(transactions.map(t => removeTagFromTransaction(tag, t, batch)));
		await batch.commit();
	}
}

export async function removeAttachmentFromTransaction(
	fileId: string,
	transaction: Transaction,
	batch?: WriteBatch
): Promise<void> {
	removeAttachmentIdFromTransaction(transaction, fileId);
	await updateTransaction(transaction, batch);
}

export async function deleteTagIfUnreferenced(tag: Tag, batch?: WriteBatch): Promise<void> {
	if (tagIsReferenced(tag.id)) return;

	// This tag is unreferenced
	const { deleteTag } = await import("./tagsStore");
	await deleteTag(tag, batch);
}

export async function deleteLocationIfUnreferenced(
	location: Location,
	batch?: WriteBatch
): Promise<void> {
	if (locationIsReferenced(location.id)) return;

	// This location is unreferenced
	const { deleteLocation } = await import("./locationsStore");
	await deleteLocation(location, batch);
}

export async function getAllTransactionsAsJson(
	account: Account
): Promise<Array<TransactionSchema>> {
	const key = get(pKey);
	if (key === null) throw new Error("No decryption key"); // TODO: I18N

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = transactionsCollection();
	const snap = await getDocs<TransactionRecordPackage>(collection);
	return snap.docs
		.map(doc => transactionFromSnapshot(doc, dek))
		.filter(transaction => transaction.accountId === account.id)
		.map(t => ({ ...recordFromTransaction(t), id: t.id }));
}

export async function importTransaction(
	transactionToImport: TransactionSchema,
	account: Account,
	batch?: WriteBatch
): Promise<void> {
	const storedTransactions = get(transactionsForAccount)[account.id] ?? {};
	const storedTransaction = storedTransactions[transactionToImport.id] ?? null;
	if (storedTransaction) {
		// If duplicate, overwrite the one we have
		const newTransaction = transaction({
			...storedTransaction,
			...transactionToImport,
			id: storedTransaction.id,
		});
		await updateTransaction(newTransaction, batch);
	} else {
		// If new, create a new transaction
		const params: TransactionRecordParams = {
			createdAt: transactionToImport.createdAt,
			amount: transactionToImport.amount,
			locationId: transactionToImport.locationId ?? null,
			isReconciled: transactionToImport.isReconciled ?? false,
			attachmentIds: transactionToImport.attachmentIds ?? [],
			tagIds: transactionToImport.tagIds ?? [],
			accountId: account.id,
			title: transactionToImport.title?.trim() ?? null,
			notes: transactionToImport.notes?.trim() ?? null,
		};
		await createTransaction(params, batch);
	}
}

export async function importTransactions(
	data: Array<TransactionSchema>,
	account: Account
): Promise<void> {
	for (const transactions of chunk(data, 500)) {
		const batch = writeBatch();
		await Promise.all(transactions.map(t => importTransaction(t, account, batch)));
		await batch.commit();
	}
	await updateUserStats();
}
