import type { Account } from "../model/Account";
import type { HashStore, TransactionRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { Location } from "../model/Location";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import type { TransactionSchema } from "../model/DatabaseSchema";
import type { Tag } from "../model/Tag";
import { dinero, add, subtract } from "dinero.js";
import { defineStore } from "pinia";
import { getDocs } from "../transport/index.js";
import { stores } from "./stores";
import { USD } from "@dinero.js/currencies";
import { useAuthStore } from "./authStore";
import { useUiStore } from "./uiStore";
import chunk from "lodash/chunk";
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

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>, // Account.id -> Transaction.id -> Transaction
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

			return [...result];
		},
	},
	actions: {
		clearCache() {
			Object.values(this.transactionsWatchers).forEach(unsubscribe => unsubscribe());
			this.transactionsWatchers = {};
			this.transactionsForAccount = {};
			console.debug("transactionsStore: cache cleared");
		},
		watchTransactions(account: Account, force: boolean = false) {
			if (this.transactionsWatchers[account.id] && !force) return;

			const watcher = this.transactionsWatchers[account.id];
			if (watcher) {
				watcher();
				delete this.transactionsWatchers[account.id];
			}

			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const collection = transactionsCollection(uid, account);

			this.transactionsWatchers[account.id] = watchAllRecords(collection, async snap => {
				const { useAccountsStore } = await import("./accountsStore");
				const accounts = useAccountsStore();
				const authStore = useAuthStore();
				const { dekMaterial } = await authStore.getDekMaterial();
				const dek = deriveDEK(pKey, dekMaterial);

				snap.docChanges().forEach(change => {
					const accountTransactions = this.transactionsForAccount[account.id] ?? {};
					let currentBalance =
						accounts.currentBalance[account.id] ?? dinero({ amount: 0, currency: USD });

					try {
						switch (change.type) {
							case "removed":
								// Update the account's balance total
								currentBalance = subtract(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? dinero({ amount: 0, currency: USD })
								);
								// Forget this transaction
								delete accountTransactions[change.doc.id];
								break;

							case "added":
								// Add this transaction
								accountTransactions[change.doc.id] = transactionFromSnapshot(
									account.id,
									change.doc,
									dek
								);
								// Update the account's balance total
								currentBalance = add(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? dinero({ amount: 0, currency: USD })
								);
								break;

							case "modified":
								// Remove this account's balance total
								currentBalance = subtract(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? dinero({ amount: 0, currency: USD })
								);
								// Update this transaction
								accountTransactions[change.doc.id] = transactionFromSnapshot(
									account.id,
									change.doc,
									dek
								);
								// Update this account's balance total
								currentBalance = add(
									currentBalance,
									accountTransactions[change.doc.id]?.amount ?? dinero({ amount: 0, currency: USD })
								);
								break;
						}

						accounts.currentBalance[account.id] = currentBalance;
						this.transactionsForAccount[account.id] = accountTransactions;
					} catch (error: unknown) {
						const ui = useUiStore();
						ui.handleError(error);
					}
				});
			});
		},
		async getTransactionsForAccount(account: Account) {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(uid, account, dek);
		},
		async getAllTransactions() {
			const { accounts } = await stores();
			for (const account of accounts.allAccounts) {
				await this.getTransactionsForAccount(account);
			}
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
			account: Account,
			record: TransactionRecordParams,
			batch?: WriteBatch
		): Promise<Transaction> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			return await createTransaction(uid, account, record, dek, batch);
		},
		async updateTransaction(transaction: Transaction, batch?: WriteBatch) {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateTransaction(uid, transaction, dek, batch);
		},
		async deleteTransaction(transaction: Transaction, batch?: WriteBatch) {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			await deleteTransaction(uid, transaction, batch);
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
			transaction.removeTagId(tag.id);
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
			transaction.removeAttachmentId(fileId);
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
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = transactionsCollection(uid, account);
			const snap = await getDocs<TransactionRecordPackage>(collection);
			return snap.docs
				.map(doc => transactionFromSnapshot(account.id, doc, dek))
				.map(t => ({ ...t.toRecord(), id: t.id }));
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
				const newTransaction = storedTransaction.updatedWith(transactionToImport);
				await this.updateTransaction(newTransaction, batch);
			} else {
				// If new, create a new transaction
				const params: TransactionRecordParams = {
					locationId: null,
					isReconciled: false,
					tagIds: [],
					attachmentIds: [],
					...transactionToImport,
					title: transactionToImport.title?.trim() ?? null,
					notes: transactionToImport.notes?.trim() ?? null,
				};
				await this.createTransaction(account, params, batch);
			}
		},
		async importTransactions(data: Array<TransactionSchema>, account: Account): Promise<void> {
			for (const transactions of chunk(data, 500)) {
				const batch = writeBatch();
				await Promise.all(transactions.map(t => this.importTransaction(t, account, batch)));
				await batch.commit();
			}
		},
	},
});
