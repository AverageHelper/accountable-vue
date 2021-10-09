import type { HashStore } from "../transport/cryption";
import type { Account, AccountRecordParams } from "../model/Account";
import { defineStore } from "pinia";
import { deriveDEK } from "../transport/cryption";
import { getAllAccounts, createAccount } from "../transport/wrapper";
import { useAuthStore } from "./authStore";

export const useAccountsStore = defineStore("accounts", {
	state: () => ({
		items: {} as Dictionary<Account>,
	}),
	actions: {
		clearCache() {
			this.items = {};
		},
		async getAccounts() {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			this.items = await getAllAccounts(uid, dek);
		},
		async createAccount(record: AccountRecordParams): Promise<Account> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const account = await createAccount(uid, record, dek);
			this.items[account.id] = account;
			return account;
		},
	},
});
