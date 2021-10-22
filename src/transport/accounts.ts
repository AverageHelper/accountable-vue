import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
} from "firebase/firestore";
import type { AccountRecordParams } from "../model/Account";
import type { EPackage, HashStore } from "./cryption";
import { encrypt } from "./cryption";
import { Account } from "../model/Account";
import { db, recordFromSnapshot } from "./db";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";

interface AccountRecordPackageMetadata {
	objectType: "Account";
}
type AccountRecordPackage = EPackage<AccountRecordPackageMetadata>;

export function accountsCollection(uid: string): CollectionReference<AccountRecordPackage> {
	const path = `users/${uid}/accounts`;
	return collection(db, path) as CollectionReference<AccountRecordPackage>;
}

function accountRef(uid: string, account: Account): DocumentReference<AccountRecordPackage> {
	const path = `users/${uid}/accounts/${account.id}`;
	return doc(db, path) as DocumentReference<AccountRecordPackage>;
}

export function accountFromSnapshot(
	doc: QueryDocumentSnapshot<AccountRecordPackage>,
	dek: HashStore
): Account {
	const { id, record } = recordFromSnapshot(doc, dek, Account.isRecord);
	return new Account(id, record);
}

export async function createAccount(
	uid: string,
	record: AccountRecordParams,
	dek: HashStore
): Promise<Account> {
	const meta: AccountRecordPackageMetadata = {
		objectType: "Account",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = await addDoc(accountsCollection(uid), pkg);
	return new Account(ref.id, record);
}

export async function updateAccount(uid: string, account: Account, dek: HashStore): Promise<void> {
	const meta: AccountRecordPackageMetadata = {
		objectType: "Account",
	};
	const record: AccountRecordParams = {
		createdAt: account.createdAt,
		notes: account.notes,
		title: account.title,
	};
	const pkg = encrypt(record, meta, dek);
	await setDoc(accountRef(uid, account), pkg);
}

export async function deleteAccount(uid: string, account: Account): Promise<void> {
	await deleteDoc(accountRef(uid, account));
}
