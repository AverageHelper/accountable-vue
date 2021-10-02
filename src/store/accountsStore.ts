import type { Account } from "../model/Account";
import { defineStore } from "pinia";
import { getAllAccounts, putAccount } from "../db/wrapper";

export const useAccountsStore = defineStore("accounts", {
	state: () => ({
		accounts: {} as Dictionary<Account>,
	}),
	actions: {
		async getAccounts() {
			this.accounts = await getAllAccounts();
		},
		async saveAccount(account: Account) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			await putAccount(account);
			this.accounts[account.id] = account;
		},
	},
});
