import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";
import type { Account, AccountRecordParams } from "../model/Account";
import type { EPackage, HashStore } from "./cryption";
import { account, isAccountRecord, recordFromAccount } from "../model/Account";
import { encrypt } from "./cryption";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";

interface AccountRecordPackageMetadata {
	objectType: "Account";
}
export type AccountRecordPackage = EPackage<AccountRecordPackageMetadata>;

export function accountsCollection(): CollectionReference<AccountRecordPackage> {
	return collection<AccountRecordPackage>(db, "accounts");
}

function accountRef(account: Account): DocumentReference<AccountRecordPackage> {
	return doc<AccountRecordPackage>(db, "accounts", account.id);
}

export function accountFromSnapshot(
	doc: QueryDocumentSnapshot<AccountRecordPackage>,
	dek: HashStore
): Account {
	const { id, record } = recordFromSnapshot(doc, dek, isAccountRecord);
	return account({ id, ...record });
}

export async function createAccount(
	record: AccountRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Account> {
	const meta: AccountRecordPackageMetadata = {
		objectType: "Account",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = doc(accountsCollection());
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return account({ id: ref.id, ...record });
}

export async function updateAccount(
	account: Account,
	dek: HashStore,
	batch?: WriteBatch
): Promise<void> {
	const meta: AccountRecordPackageMetadata = {
		objectType: "Account",
	};
	const record = recordFromAccount(account);
	const pkg = encrypt(record, meta, dek);
	const ref = accountRef(account);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteAccount(account: Account, batch?: WriteBatch): Promise<void> {
	const ref = accountRef(account);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
