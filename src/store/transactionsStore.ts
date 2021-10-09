import type { HashStore } from "../transport/cryption";
import type { Account } from "../model/Account";
import type { Transaction, TransactionRecordParams } from "../model/Transaction";
import { defineStore } from "pinia";
import { deriveDEK } from "../transport/cryption";
import { getTransactionsForAccount, createTransaction } from "../transport/wrapper";
import { useAuthStore } from "./authStore";

export const useTransactionsStore = defineStore("transactions", {
	state: () => ({
		transactionsForAccount: {} as Dictionary<Dictionary<Transaction>>,
	}),
	actions: {
		clearCache() {
			this.transactionsForAccount = {};
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
			this.transactionsForAccount[account.id] = await getTransactionsForAccount(uid, account, dek);
			return transaction;
		},
	},
});
