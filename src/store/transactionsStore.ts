import type { HashStore } from "../transport/cryption";
import type { Account } from "../model/Account";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
import { deriveDEK } from "../transport/cryption";
import { useAuthStore } from "./authStore";
import {
	getTransactionsForAccount,
	createTransaction,
	updateTransaction,
	deleteTransaction,
	watchAllTransactions,
	transactionFromSnapshot,
} from "../transport/wrapper";

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>,
		transactionsWatchers: {} as Dictionary<Unsubscribe>,
	}),
	actions: {
		clearCache() {
			this.transactionsForAccount = {};
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

			this.transactionsWatchers[account.id] = watchAllTransactions(uid, account, async snap => {
				const authStore = useAuthStore();
				const { dekMaterial } = await authStore.getDekMaterial();
				const dek = deriveDEK(pKey, dekMaterial);

				snap.docChanges().forEach(change => {
					const accountTransactions = this.transactionsForAccount[account.id] ?? {};
					switch (change.type) {
						case "removed":
							delete accountTransactions[change.doc.id];
							break;

						case "added":
						case "modified":
							accountTransactions[change.doc.id] = transactionFromSnapshot(
								account.id,
								change.doc,
								dek
							);
							break;
					}
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
	},
});
