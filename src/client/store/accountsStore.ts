import type { Account, AccountRecordParams } from "../model/Account";
import type { AccountSchema } from "../model/DatabaseSchema";
import type { Dinero } from "dinero.js";
import type { HashStore } from "../transport";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
import { getDocs } from "firebase/firestore";
import { stores } from "./stores";
import { useAuthStore } from "./authStore";
import {
	asyncMap,
	createAccount,
	deriveDEK,
	updateAccount,
	deleteAccount,
	accountFromSnapshot,
	accountsCollection,
	watchAllRecords,
} from "../transport";

export const useAccountsStore = defineStore("accounts", {
	state: () => ({
		items: {} as Dictionary<Account>, // Account.id -> Account
		currentBalance: {} as Dictionary<Dinero<number>>, // Account.id -> Dinero
		loadError: null as Error | null,
		accountsWatcher: null as Unsubscribe | null,
	}),
	getters: {
		allAccounts(state): Array<Account> {
			return Object.values(state.items);
		},
		numberOfAccounts(): number {
			return this.allAccounts.length;
		},
	},
	actions: {
		clearCache() {
			if (this.accountsWatcher) {
				this.accountsWatcher();
				this.accountsWatcher = null;
			}
			this.items = {};
			this.currentBalance = {};
			this.loadError = null;
			console.log("accountsStore: cache cleared");
		},
		watchAccounts(force: boolean = false) {
			if (this.accountsWatcher && !force) return;

			if (this.accountsWatcher) {
				this.accountsWatcher();
				this.accountsWatcher = null;
			}

			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const collection = accountsCollection(uid);
			this.accountsWatcher = watchAllRecords(
				collection,
				async snap => {
					this.loadError = null;
					const authStore = useAuthStore();
					const { dekMaterial } = await authStore.getDekMaterial();
					const dek = deriveDEK(pKey, dekMaterial);

					snap.docChanges().forEach(change => {
						switch (change.type) {
							case "removed":
								delete this.items[change.doc.id];
								break;

							case "added":
							case "modified":
								this.items[change.doc.id] = accountFromSnapshot(change.doc, dek);
								break;
						}
					});
				},
				error => {
					this.loadError = error;
				}
			);
		},
		async createAccount(record: AccountRecordParams): Promise<Account> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			return await createAccount(uid, record, dek);
		},
		async updateAccount(account: Account): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateAccount(uid, account, dek);
		},
		async deleteAccount(this: void, account: Account): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			// Don't delete if we have transactions
			const { useTransactionsStore } = await import("./transactionsStore");
			const transactions = useTransactionsStore();
			await transactions.getTransactionsForAccount(account);
			const accountTransactions = transactions.transactionsForAccount[account.id] ?? {};
			const transactionCount = Object.keys(accountTransactions).length;
			if (transactionCount !== 0) {
				throw new Error("Cannot delete an account that has transactions.");
			}

			await deleteAccount(uid, account);
		},
		async deleteAllAccounts(): Promise<void> {
			await Promise.all(this.allAccounts.map(this.deleteAccount));
		},
		async getAllAccountsAsJson(): Promise<Array<AccountSchema>> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const { transactions: transactionsStore } = await stores();

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = accountsCollection(uid);
			const snap = await getDocs(collection);
			const accounts = snap.docs.map(doc => accountFromSnapshot(doc, dek));
			return await asyncMap(accounts, async acct => {
				const transactions = await transactionsStore.getAllTransactionsAsJson(acct);
				return {
					id: acct.id,
					...acct.toRecord(),
					transactions,
				};
			});
		},
		async importAccount(accountToImport: AccountSchema): Promise<void> {
			const accountId = accountToImport.id;
			const storedAccount = this.items[accountId] ?? null;

			let newAccount: Account;
			if (storedAccount) {
				// If duplicate, overwrite the one we have
				newAccount = storedAccount.updatedWith(accountToImport);
				await this.updateAccount(newAccount);
			} else {
				// If new, create a new account
				const params: AccountRecordParams = {
					...accountToImport,
					title: accountToImport.title.trim(),
					notes: accountToImport.notes?.trim() ?? null,
				};
				newAccount = await this.createAccount(params);
			}

			const { transactions } = await stores();
			await transactions.importTransactions(accountToImport.transactions ?? [], newAccount);
		},
	},
});
