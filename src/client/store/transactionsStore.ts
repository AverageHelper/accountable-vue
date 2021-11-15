import type { Account } from "../model/Account";
import type { HashStore } from "../transport";
import type { Location } from "../model/Location";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import type { Tag } from "../model/Tag";
import type { Unsubscribe } from "firebase/auth";
import { dinero, add, subtract } from "dinero.js";
import { defineStore } from "pinia";
import { USD } from "@dinero.js/currencies";
import { useAuthStore } from "./authStore";
import {
	getTransactionsForAccount,
	createTransaction,
	deriveDEK,
	updateTransaction,
	deleteTransaction,
	transactionFromSnapshot,
	transactionsCollection,
	watchAllRecords,
} from "../transport";
import { useToast } from "vue-toastification";

export type TransactionsDownloadable = Array<TransactionRecordParams & { id: string }>;

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
			console.log("transactionsStore: cache cleared");
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

			const toast = useToast();
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
						let message: string;
						if (error instanceof Error) {
							message = error.message;
						} else {
							message = JSON.stringify(error);
						}
						toast.error(message);
						console.error(error);
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
		async createTransaction(
			account: Account,
			record: TransactionRecordParams
		): Promise<Transaction> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const transaction = await createTransaction(uid, account, record, dek);
			return transaction;
		},
		async updateTransaction(transaction: Transaction) {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateTransaction(uid, transaction, dek);
		},
		async deleteTransaction(transaction: Transaction) {
			if (transaction.attachmentIds.length > 0) {
				throw new Error("Cannot delete a transaction that has attachments. Delete those first.");
			}

			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			await deleteTransaction(uid, transaction);
		},
		async removeTagFromTransaction(tag: Tag, transaction: Transaction): Promise<void> {
			transaction.removeTagId(tag.id);
			await this.updateTransaction(transaction);
		},
		async removeTagFromAllTransactions(tag: Tag): Promise<void> {
			await Promise.all(
				this.allTransactions
					.filter(t => t.tagIds.includes(tag.id)) // for each T that has this tag...
					.map(t => this.removeTagFromTransaction(tag, t)) // remove the tag
			);
		},
		async removeAttachmentFromTransaction(fileId: string, transaction: Transaction): Promise<void> {
			transaction.removeAttachmentId(fileId);
			await this.updateTransaction(transaction);
		},
		async deleteTagIfUnreferenced(tag: Tag): Promise<void> {
			if (this.tagIsReferenced(tag.id)) return;

			// This tag is unreferenced
			const { useTagsStore } = await import("./tagsStore");
			const tags = useTagsStore();
			await tags.deleteTag(tag);
		},
		async deleteLocationIfUnreferenced(location: Location) {
			if (this.locationIsReferenced(location.id)) return;

			// This location is unreferenced
			const { useLocationsStore } = await import("./locationsStore");
			const locations = useLocationsStore();
			await locations.deleteLocation(location);
		},
	},
});
