import type { Account } from "../model/Account";
import type { Dinero } from "dinero.js";
import type { HashStore, TransactionRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { Location } from "../model/Location";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import type { TransactionSchema } from "../model/DatabaseSchema";
import type { Tag } from "../model/Tag";
import { add, subtract } from "dinero.js";
import { defineStore } from "pinia";
import { getDocs } from "../transport/index.js";
import { reverseChronologically } from "../model/utility/sort";
import { stores } from "./stores";
import { useAccountsStore } from "./accountsStore";
import { useAuthStore } from "./authStore";
import { useUiStore } from "./uiStore";
import { zeroDinero } from "../helpers/dineroHelpers";
import chunk from "lodash/chunk";
import groupBy from "lodash/groupBy";
import {
	recordFromTransaction,
	removeAttachmentIdFromTransaction,
	removeTagFromTransaction,
	transaction,
} from "../model/Transaction";
import {
	getTransactionsForAccount,
	createTransaction,
	deriveDEK,
	updateTransaction,
	deleteTransaction,
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

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>, // Account.id -> Transaction.id -> Transaction
		accountBalancesForTransaction: {} as Dictionary<Dictionary<Dinero<number>>>, // Account.id -> Transaction.id -> amount
		transactionsForAccountByMonth: {} as Dictionary<Dictionary<Array<Transaction>>>, // Account.id -> month -> Transaction[]
		months: {} as Dictionary<Month>,
		transactionsWatchers: {} as Dictionary<Unsubscribe>, // Transaction.id -> Unsubscribe
	}),
	getters: {
		allTransactions(state): ReadonlyArray<Transaction> {
			const result = new Set<Transaction>();

			Object.values(state.transactionsForAccount).forEach(transactions => {
				Object.values(transactions).forEach(transaction => {
					result.add(transaction as Transaction);
				});
			});

			return Array.from(result);
		},
	},
	actions: {
		clearCache() {
			Object.values(this.transactionsWatchers).forEach(unsubscribe => unsubscribe());
			this.accountBalancesForTransaction = {};
			this.transactionsWatchers = {};
			this.transactionsForAccount = {};
			this.transactionsForAccountByMonth = {};
			console.debug("transactionsStore: cache cleared");
		},
		async watchTransactions(account: Account, force: boolean = false) {
			if (this.transactionsWatchers[account.id] && !force) return;

			const watcher = this.transactionsWatchers[account.id];
			if (watcher) {
				watcher();
				delete this.transactionsWatchers[account.id];
			}

			// Clear the known balance, the watcher will set it right
			const accounts = useAccountsStore();
			delete accounts.currentBalance[account.id];

			// Get decryption key ready
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			// Watch the collection
			const collection = transactionsCollection();
			this.transactionsWatchers[account.id] = watchAllRecords(
				collection,
				snap => {
					// Clear derived cache
					delete this.transactionsForAccountByMonth[account.id];

					// Update cache
					snap.docChanges().forEach(change => {
						const accountTransactions = this.transactionsForAccount[account.id] ?? {};
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
							this.transactionsForAccount[account.id] = accountTransactions;
						} catch (error) {
							const ui = useUiStore();
							ui.handleError(error);
						}
					});

					// Derive cache
					const months: Dictionary<Month> = {};
					const groupedTransactions = groupBy(
						this.transactionsForAccount[account.id] ?? {},
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
							months[month.id] = month; // cache the month short ID with its sortable date
							return month.id;
						}
					);
					for (const month of Object.keys(groupedTransactions)) {
						// Sort each transaction list
						groupedTransactions[month]?.sort(reverseChronologically);
					}
					this.months = months; // save months before we save transactions, so components know how to sort things
					this.transactionsForAccountByMonth[account.id] = groupedTransactions;
				},
				error => {
					console.error(error);
					const watcher = this.transactionsWatchers[account.id];
					if (watcher) watcher();
					delete this.transactionsWatchers[account.id];
				}
			);
		},
		async getTransactionsForAccount(account: Account) {
			const authStore = useAuthStore();
			const accounts = useAccountsStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const transactions = await getTransactionsForAccount(account, dek);
			const totalBalance: Dinero<number> = Object.values(transactions).reduce(
				(balance, transaction) => {
					return add(balance, transaction.amount);
				},
				zeroDinero
			);

			this.transactionsForAccount[account.id] = transactions;
			accounts.currentBalance[account.id] = totalBalance;
		},
		async getAllTransactions() {
			const { accounts } = await stores();
			for (const account of accounts.allAccounts) {
				await this.getTransactionsForAccount(account);
			}
		},
		async computeBalanceAfterTransaction(txn: Transaction): Promise<void> {
			// No transactions cached? Return for later.
			const accountId = txn.accountId;
			if (!this.transactionsForAccount[accountId]) return;

			// Check cache for existing balance amount
			this.accountBalancesForTransaction[accountId] ??= {};
			const accountBalances = this.accountBalancesForTransaction[accountId] ?? {};
			const storedbalance = accountBalances[txn.id];
			if (storedbalance !== undefined) return; // balance already found and cached!

			await new Promise(resolve => setTimeout(resolve, 15)); // wait 15 ms for UI to catch up

			// Balance not found. Compute it!
			let balance = txn.amount;
			const allTransactions = this.allTransactions;
			const idx = allTransactions.findIndex(t => t.id === txn.id);
			const balances = allTransactions
				.slice(0, idx) // transactions to check
				.map(t => t.amount); // only need amount from each txn

			balances.forEach(amount => {
				balance = add(balance, amount);
			});

			accountBalances[txn.id] = balance;
		},
		tagIsReferenced(tagId: string): boolean {
			for (const transaction of this.allTransactions) {
				if (transaction.tagIds.includes(tagId)) {
					// This tag is referenced
					return true;
				}
			}

			return false;
		},
		locationIsReferenced(locationId: string): boolean {
			for (const transaction of this.allTransactions) {
				if (transaction.locationId === locationId) {
					// This location is referenced
					return true;
				}
			}

			return false;
		},
		numberOfReferencesForTag(tagId: string | undefined): number {
			if (tagId === undefined) return 0;
			let count = 0;

			this.allTransactions.forEach(transaction => {
				if (transaction.tagIds.includes(tagId)) {
					count += 1;
				}
			});

			return count;
		},
		numberOfReferencesForLocation(locationId: string | undefined): number {
			if (locationId === undefined) return 0;
			let count = 0;

			this.allTransactions.forEach(transaction => {
				if (transaction.locationId === locationId) {
					count += 1;
				}
			});

			return count;
		},
		async createTransaction(
			record: TransactionRecordParams,
			batch?: WriteBatch
		): Promise<Transaction> {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const transaction = await createTransaction(record, dek, batch);
			if (!batch) await uiStore.updateUserStats();
			return transaction;
		},
		async updateTransaction(transaction: Transaction, batch?: WriteBatch) {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateTransaction(transaction, dek, batch);
			if (!batch) await uiStore.updateUserStats();
		},
		async deleteTransaction(transaction: Transaction, batch?: WriteBatch) {
			const uiStore = useUiStore();
			await deleteTransaction(transaction, batch);
			if (!batch) await uiStore.updateUserStats();
		},
		async deleteAllTransactions(): Promise<void> {
			for (const transactions of chunk(this.allTransactions, 500)) {
				const batch = writeBatch();
				await Promise.all(transactions.map(t => this.deleteTransaction(t, batch)));
				await batch.commit();
			}
		},
		async removeTagFromTransaction(
			tag: Tag,
			transaction: Transaction,
			batch?: WriteBatch
		): Promise<void> {
			removeTagFromTransaction(transaction, tag);
			await this.updateTransaction(transaction, batch);
		},
		async removeTagFromAllTransactions(tag: Tag): Promise<void> {
			// for each transaction that has this tag, remove the tag
			const relevantTransactions = this.allTransactions.filter(t => t.tagIds.includes(tag.id));
			for (const transactions of chunk(relevantTransactions, 500)) {
				const batch = writeBatch();
				await Promise.all(transactions.map(t => this.removeTagFromTransaction(tag, t, batch)));
				await batch.commit();
			}
		},
		async removeAttachmentFromTransaction(
			fileId: string,
			transaction: Transaction,
			batch?: WriteBatch
		): Promise<void> {
			removeAttachmentIdFromTransaction(transaction, fileId);
			await this.updateTransaction(transaction, batch);
		},
		async deleteTagIfUnreferenced(tag: Tag, batch?: WriteBatch): Promise<void> {
			if (this.tagIsReferenced(tag.id)) return;

			// This tag is unreferenced
			const { useTagsStore } = await import("./tagsStore");
			const tags = useTagsStore();
			await tags.deleteTag(tag, batch);
		},
		async deleteLocationIfUnreferenced(location: Location, batch?: WriteBatch) {
			if (this.locationIsReferenced(location.id)) return;

			// This location is unreferenced
			const { useLocationsStore } = await import("./locationsStore");
			const locations = useLocationsStore();
			await locations.deleteLocation(location, batch);
		},
		async getAllTransactionsAsJson(account: Account): Promise<Array<TransactionSchema>> {
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key"); // TODO: I18N

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = transactionsCollection();
			const snap = await getDocs<TransactionRecordPackage>(collection);
			return snap.docs
				.map(doc => transactionFromSnapshot(doc, dek))
				.filter(transaction => transaction.accountId === account.id)
				.map(t => ({ ...recordFromTransaction(t), id: t.id }));
		},
		async importTransaction(
			transactionToImport: TransactionSchema,
			account: Account,
			batch?: WriteBatch
		): Promise<void> {
			const storedTransactions = this.transactionsForAccount[account.id] ?? {};
			const storedTransaction = storedTransactions[transactionToImport.id] ?? null;
			if (storedTransaction) {
				// If duplicate, overwrite the one we have
				const newTransaction = transaction({
					...storedTransaction,
					...transactionToImport,
					id: storedTransaction.id,
				});
				await this.updateTransaction(newTransaction, batch);
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
				await this.createTransaction(params, batch);
			}
		},
		async importTransactions(data: Array<TransactionSchema>, account: Account): Promise<void> {
			const uiStore = useUiStore();
			for (const transactions of chunk(data, 500)) {
				const batch = writeBatch();
				await Promise.all(transactions.map(t => this.importTransaction(t, account, batch)));
				await batch.commit();
			}
			await uiStore.updateUserStats();
		},
	},
});
