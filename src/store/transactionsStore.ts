import type { HashStore } from "../transport";
import type { Account } from "../model/Account";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import type { Tag } from "../model/Tag";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
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

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>, // Account.id -> Transaction.id -> Transaction
		transactionsWatchers: {} as Dictionary<Unsubscribe>, // Transaction.id -> Unsubscribe
	}),
	actions: {
		clearCache() {
			this.transactionsForAccount = {};
			Object.values(this.transactionsWatchers).forEach(unsubscribe => unsubscribe());
			this.transactionsWatchers = {};
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
					let currentBalance = accounts.currentBalance[account.id] ?? 0;

					switch (change.type) {
						case "removed":
							// Update the account's balance total
							currentBalance -= accountTransactions[change.doc.id]?.amount ?? 0;
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
							currentBalance += accountTransactions[change.doc.id]?.amount ?? 0;
							break;

						case "modified":
							// Update this account's balance total
							currentBalance -= accountTransactions[change.doc.id]?.amount ?? 0;
							// Update this transaction
							accountTransactions[change.doc.id] = transactionFromSnapshot(
								account.id,
								change.doc,
								dek
							);
							currentBalance += accountTransactions[change.doc.id]?.amount ?? 0;
							break;
					}

					accounts.currentBalance[account.id] = currentBalance;
					this.transactionsForAccount[account.id] = accountTransactions;
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
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			// TODO: Don't delete if we have attachments

			await deleteTransaction(uid, transaction);
		},
		async deleteTagIfUnreferenced(tag: Tag): Promise<void> {
			// TODO: This is inefficient with many transactions. Consider storing tag references elsewhere, and acting based on that
			for (const transactions of Object.values(this.transactionsForAccount)) {
				for (const transaction of Object.values(transactions)) {
					if (transaction.tagIds.includes(tag.id)) {
						// This tag is referenced
						return;
					}
				}
			}

			// This tag is unreferenced
			const { useTagsStore } = await import("./tagsStore");
			const tags = useTagsStore();
			await tags.deleteTag(tag);
		},
	},
});
