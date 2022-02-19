import type { Account, AccountRecordParams } from "../model/Account";
import type { AccountSchema } from "../model/DatabaseSchema";
import type { Dinero } from "dinero.js";
import type { AccountRecordPackage, HashStore, Unsubscribe, WriteBatch } from "../transport";
import { defineStore } from "pinia";
import { stores } from "./stores";
import { useAuthStore } from "./authStore";
import { useUiStore } from "./uiStore";
import chunk from "lodash/chunk";
import {
	asyncMap,
	createAccount,
	getDocs,
	deriveDEK,
	updateAccount,
	deleteAccount,
	accountFromSnapshot,
	accountsCollection,
	watchAllRecords,
	writeBatch,
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
			console.debug("accountsStore: cache cleared");
		},
		async watchAccounts(force: boolean = false) {
			if (this.accountsWatcher && !force) return;

			if (this.accountsWatcher) {
				this.accountsWatcher();
				this.accountsWatcher = null;
			}

			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = accountsCollection();
			this.accountsWatcher = watchAllRecords(
				collection,
				snap => {
					this.loadError = null;

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
					console.error(error);
				}
			);
		},
		async createAccount(record: AccountRecordParams, batch?: WriteBatch): Promise<Account> {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			const account = await createAccount(record, dek, batch);
			if (!batch) await uiStore.updateUserStats();
			return account;
		},
		async updateAccount(account: Account, batch?: WriteBatch): Promise<void> {
			const authStore = useAuthStore();
			const uiStore = useUiStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);
			await updateAccount(account, dek, batch);
			if (!batch) await uiStore.updateUserStats();
		},
		async deleteAccount(account: Account, batch?: WriteBatch): Promise<void> {
			// Don't delete if we have transactions
			const uiStore = useUiStore();
			const { useTransactionsStore } = await import("./transactionsStore");
			const transactions = useTransactionsStore();
			await transactions.getTransactionsForAccount(account);

			const accountTransactions = transactions.transactionsForAccount[account.id] ?? {};
			const transactionCount = Object.keys(accountTransactions).length;
			if (transactionCount !== 0) {
				throw new Error("Cannot delete an account that has transactions.");
			}

			await deleteAccount(account, batch);
			if (!batch) await uiStore.updateUserStats();
		},
		async deleteAllAccounts(): Promise<void> {
			for (const accounts of chunk(this.allAccounts, 500)) {
				const batch = writeBatch();
				await Promise.all(accounts.map(a => this.deleteAccount(a, batch)));
				await batch.commit();
			}
		},
		async getAllAccountsAsJson(): Promise<Array<AccountSchema>> {
			const authStore = useAuthStore();
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");

			const { transactions: transactionsStore } = await stores();

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = accountsCollection();
			const snap = await getDocs<AccountRecordPackage>(collection);
			const accounts = snap.docs.map(doc => accountFromSnapshot(doc, dek));
			return await asyncMap(accounts, async acct => {
				const transactions = await transactionsStore.getAllTransactionsAsJson(acct);
				return { ...acct.toRecord(), id: acct.id, transactions };
			});
		},
		async importAccount(accountToImport: AccountSchema, batch?: WriteBatch): Promise<void> {
			const uiStore = useUiStore();
			const accountId = accountToImport.id;
			const storedAccount = this.items[accountId] ?? null;

			let newAccount: Account;
			if (storedAccount) {
				// If duplicate, overwrite the one we have
				newAccount = storedAccount.updatedWith(accountToImport);
				await this.updateAccount(newAccount, batch);
			} else {
				// If new, create a new account
				const params: AccountRecordParams = {
					createdAt: accountToImport.createdAt,
					title: accountToImport.title.trim(),
					notes: accountToImport.notes?.trim() ?? null,
				};
				newAccount = await this.createAccount(params, batch);
			}
			if (!batch) await uiStore.updateUserStats();

			const { transactions } = await stores();
			await transactions.importTransactions(accountToImport.transactions ?? [], newAccount);
		},
	},
});
