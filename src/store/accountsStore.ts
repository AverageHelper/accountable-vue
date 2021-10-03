import type { Account, AccountRecordParams } from "../model/Account";
import { defineStore } from "pinia";
import { getAllAccounts, createAccount } from "../db/wrapper";

export const useAccountsStore = defineStore("accounts", {
	state: () => ({
		items: {} as Dictionary<Account>,
	}),
	actions: {
		async getAccounts() {
			this.items = await getAllAccounts();
		},
		async createAccount(record: AccountRecordParams): Promise<Account> {
			const account = await createAccount(record);
			this.items[account.id] = account;
			return account;
		},
	},
});
