import type { Account } from "../model/Account";
import type { Transaction } from "../model/Transaction";
import { defineStore } from "pinia";
import { getTransactionsForAccount, putTransaction } from "../db/wrapper";

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>,
	}),
	actions: {
		async getTransactionsForAccount(account: Account) {
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(account);
		},
		async saveTransaction(transaction: Transaction, account: Account) {
			await putTransaction(transaction, account);
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(account);
		},
	},
});
