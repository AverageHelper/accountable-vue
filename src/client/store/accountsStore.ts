import type { Account, AccountRecordParams } from "../model/Account";
import type { AttachmentsDownloadable } from "./attachmentsStore";
import type { Dinero } from "dinero.js";
import type { HashStore } from "../transport";
import type { LocationsDownloadable } from "./locationsStore";
import type { TagsDownloadable } from "./tagsStore";
import type { TransactionsDownloadable } from "./transactionsStore";
import type { Unsubscribe } from "firebase/auth";
import { defineStore } from "pinia";
import { getDocs } from "firebase/firestore";
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

export type AccountsDownloadable = Array<
	AccountRecordParams & {
		id: string;
		attachments: AttachmentsDownloadable;
		locations: LocationsDownloadable;
		transactions: TransactionsDownloadable;
		tags: TagsDownloadable;
	}
>;

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
		async deleteAccount(account: Account): Promise<void> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			if (uid === null) throw new Error("Sign in first");

			// Don't delete if we have transactions
			const { useTransactionsStore } = await import("./transactionsStore");
			const transactions = useTransactionsStore();
			const accountTransactions = transactions.transactionsForAccount[account.id] ?? {};
			const transactionCount = Object.keys(accountTransactions).length;
			if (transactionCount !== 0) {
				throw new Error("Cannot delete an account that has transactions.");
			}

			await deleteAccount(uid, account);
		},
		async getAllAccountsAsJson(): Promise<AccountsDownloadable> {
			const authStore = useAuthStore();
			const uid = authStore.uid;
			const pKey = authStore.pKey as HashStore | null;
			if (pKey === null) throw new Error("No decryption key");
			if (uid === null) throw new Error("Sign in first");

			const [
				{ useAttachmentsStore }, //
				{ useLocationsStore },
				{ useTransactionsStore },
				{ useTagsStore },
			] = await Promise.all([
				import("./attachmentsStore"), //
				import("./locationsStore"),
				import("./transactionsStore"),
				import("./tagsStore"),
			]);
			const attachmentsStore = useAttachmentsStore();
			const locationsStore = useLocationsStore();
			const transactionsStore = useTransactionsStore();
			const tagsStore = useTagsStore();

			const { dekMaterial } = await authStore.getDekMaterial();
			const dek = deriveDEK(pKey, dekMaterial);

			const collection = accountsCollection(uid);
			const snap = await getDocs(collection);
			const accounts = snap.docs.map(doc => accountFromSnapshot(doc, dek));
			const data: AccountsDownloadable = await asyncMap(accounts, async acct => {
				const [attachments, locations, transactions, tags] = await Promise.all([
					attachmentsStore.getAllAttachmentsAsJson(),
					locationsStore.getAllLocationsAsJson(),
					transactionsStore.getAllTransactionsAsJson(acct),
					tagsStore.getAllTagsAsJson(),
				]);

				return {
					id: acct.id,
					...acct.toRecord(),
					locations,
					transactions,
					tags,
					attachments,
				};
			});

			return data;
		},
	},
});
