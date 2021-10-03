import type { Account } from "../model/Account";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import { defineStore } from "pinia";
import { getTransactionsForAccount, createTransaction } from "../transport/wrapper";

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>,
	}),
	actions: {
		async getTransactionsForAccount(account: Account) {
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(account);
		},
		async createTransaction(
			account: Account,
			record: TransactionRecordParams
		): Promise<Transaction> {
			const transaction = await createTransaction(account, record);
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(account);
			return transaction;
		},
	},
});
