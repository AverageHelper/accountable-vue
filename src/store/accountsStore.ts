import type { Account, AccountRecordParams } from "../model/Account";
import { defineStore } from "pinia";
import { getAllAccounts, createAccount } from "../transport/wrapper";
import { useAuthStore } from "./authStore";

export const useAccountsStore = defineStore("accounts", {
	state: () => ({
		items: {} as Dictionary<Account>,
	}),
	actions: {
		async getAccounts() {
			const authStore = useAuthStore();
			const key = authStore.pKey?.value;
			if (key === undefined) {
				throw new Error("No decryption key");
			}
			this.items = await getAllAccounts(key);
		},
		async createAccount(record: AccountRecordParams): Promise<Account> {
			const authStore = useAuthStore();
			const key = authStore.pKey?.value;
			if (key === undefined) {
				throw new Error("No decryption key");
			}
			const account = await createAccount(record, key);
			this.items[account.id] = account;
			return account;
		},
	},
});
