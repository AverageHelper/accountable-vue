import type { Account } from "../model/Account";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import { defineStore } from "pinia";
import { getTransactionsForAccount, createTransaction } from "../transport/wrapper";
import { useAuthStore } from "./authStore";

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>,
	}),
	actions: {
		async getTransactionsForAccount(account: Account) {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const key = authStore.pKey?.value;
			if (key === undefined || uid === null) {
				throw new Error("No decryption key");
			}
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(uid, account, key);
		},
		async createTransaction(
			account: Account,
			record: TransactionRecordParams
		): Promise<Transaction> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const key = authStore.pKey?.value;
			if (key === undefined || uid === null) {
				throw new Error("No decryption key");
			}
			const transaction = await createTransaction(uid, account, record, key);
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(uid, account, key);
			return transaction;
		},
	},
});
