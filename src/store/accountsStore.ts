import type { Account, AccountRecordParams } from "../model/Account";
import type { AccountRecordPackage, Unsubscribe, WriteBatch } from "../transport";
import type { AccountSchema } from "../model/DatabaseSchema";
import type { Dinero } from "dinero.js";
import { _ } from "svelte-i18n";
import { account, recordFromAccount } from "../model/Account";
import { derived, get, writable } from "svelte/store";
import { getDekMaterial, pKey } from "./authStore";
import { updateUserStats } from "./uiStore";
import chunk from "lodash/chunk";
import {
	asyncMap,
	createAccount as _createAccount,
	getDocs,
	deriveDEK,
	updateAccount as _updateAccount,
	deleteAccount as _deleteAccount,
	accountFromSnapshot,
	accountsCollection,
	watchAllRecords,
	writeBatch,
} from "../transport";

const t = get(_);

export const accounts = writable<Record<string, Account>>({}); // Account.id -> Account
export const currentBalance = writable<Record<string, Dinero<number>>>({}); // Account.id -> Dinero
export const accountsLoadError = writable<Error | null>(null);
export const accountsWatcher = writable<Unsubscribe | null>(null);

export const allAccounts = derived(accounts, $accounts => {
	return Object.values($accounts);
});

export const numberOfAccounts = derived(allAccounts, $allAccounts => {
	return $allAccounts.length;
});

export function clearAccountsCache(): void {
	const watcher = get(accountsWatcher);
	if (watcher) {
		watcher();
		accountsWatcher.set(null);
	}
	accounts.set({});
	currentBalance.set({});
	accountsLoadError.set(null);
	console.debug("accountsStore: cache cleared");
}

export async function watchAccounts(force: boolean = false): Promise<void> {
	const watcher = get(accountsWatcher);
	if (watcher && !force) return;

	if (watcher) {
		watcher();
		accountsWatcher.set(null);
	}

	const key = get(pKey);
	if (key === null) throw new Error(t("error.cryption.missing-pek"));
	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = accountsCollection();
	accountsLoadError.set(null);
	accountsWatcher.set(
		watchAllRecords(
			collection,
			snap => {
				snap.docChanges().forEach(change => {
					switch (change.type) {
						case "removed":
							accounts.update(accounts => {
								const copy = { ...accounts };
								delete copy[change.doc.id];
								return copy;
							});
							break;

						case "added":
						case "modified":
							accounts.update(accounts => {
								const copy = { ...accounts };
								copy[change.doc.id] = accountFromSnapshot(change.doc, dek);
								return copy;
							});
							break;
					}
				});
			},
			error => {
				accountsLoadError.set(error);
				const watcher = get(accountsWatcher);
				if (watcher) watcher();
				accountsWatcher.set(null);
				console.error(error);
			}
		)
	);
}

export async function createAccount(
	record: AccountRecordParams,
	batch?: WriteBatch
): Promise<Account> {
	const key = get(pKey);
	if (key === null) throw new Error(t("error.cryption.missing-pek"));

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	const account = await _createAccount(record, dek, batch);
	if (!batch) await updateUserStats();
	return account;
}

export async function updateAccount(account: Account, batch?: WriteBatch): Promise<void> {
	const key = get(pKey);
	if (key === null) throw new Error(t("error.cryption.missing-pek"));

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);
	await _updateAccount(account, dek, batch);
	if (!batch) await updateUserStats();
}

export async function deleteAccount(account: Account, batch?: WriteBatch): Promise<void> {
	// Don't delete if we have transactions
	const { getTransactionsForAccount, transactionsForAccount } = await import("./transactionsStore");
	await getTransactionsForAccount(account);

	const accountTransactions = get(transactionsForAccount)[account.id] ?? {};
	const transactionCount = Object.keys(accountTransactions).length;
	if (transactionCount !== 0) {
		throw new Error("Cannot delete an account that has transactions."); // TODO: I18N
	}

	await _deleteAccount(account, batch);
	if (!batch) await updateUserStats();
}

export async function deleteAllAccounts(): Promise<void> {
	for (const accounts of chunk(get(allAccounts), 500)) {
		const batch = writeBatch();
		await Promise.all(accounts.map(a => deleteAccount(a, batch)));
		await batch.commit();
	}
}

export async function getAllAccountsAsJson(): Promise<Array<AccountSchema>> {
	const key = get(pKey);
	if (key === null) throw new Error(t("error.cryption.missing-pek"));

	const { getAllTransactionsAsJson } = await import("./transactionsStore");

	const { dekMaterial } = await getDekMaterial();
	const dek = deriveDEK(key, dekMaterial);

	const collection = accountsCollection();
	const snap = await getDocs<AccountRecordPackage>(collection);
	const accounts = snap.docs.map(doc => accountFromSnapshot(doc, dek));
	return await asyncMap(accounts, async acct => {
		const transactions = await getAllTransactionsAsJson(acct);
		return { ...recordFromAccount(acct), id: acct.id, transactions };
	});
}

export async function importAccount(
	accountToImport: AccountSchema,
	batch?: WriteBatch
): Promise<void> {
	const accountId = accountToImport.id;
	const storedAccount = get(accounts)[accountId] ?? null;

	let newAccount: Account;
	if (storedAccount) {
		// If duplicate, overwrite the one we have
		newAccount = account({ ...storedAccount, ...accountToImport });
		await updateAccount(newAccount, batch);
	} else {
		// If new, create a new account
		const params: AccountRecordParams = {
			createdAt: accountToImport.createdAt,
			title: accountToImport.title.trim(),
			notes: accountToImport.notes?.trim() ?? null,
		};
		newAccount = await createAccount(params, batch);
	}
	if (!batch) await updateUserStats();

	const { importTransactions } = await import("./transactionsStore");
	await importTransactions(accountToImport.transactions ?? [], newAccount);
}
