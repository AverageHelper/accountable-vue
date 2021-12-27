import type { Account } from "../model/Account";
import type { EPackage, HashStore } from "./cryption";
import type { TransactionRecordParams } from "../model/Transaction";
import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc, getDocs } from "./db";
import { encrypt } from "./cryption";
import { Transaction } from "../model/Transaction";

interface TransactionRecordPackageMetadata {
	objectType: "Transaction";
}
export type TransactionRecordPackage = EPackage<TransactionRecordPackageMetadata>;

function transactionRef(
	uid: string,
	transaction: Transaction
): DocumentReference<TransactionRecordPackage> {
	const { accountId, id } = transaction;
	return doc<TransactionRecordPackage>(db, "transactions", id);
}

export function transactionsCollection(
	uid: string,
	account: Account
): CollectionReference<TransactionRecordPackage> {
	return collection<TransactionRecordPackage>(db, "transactions");
}

export function transactionFromSnapshot(
	accountId: string,
	doc: QueryDocumentSnapshot<TransactionRecordPackage>,
	dek: HashStore
): Transaction {
	const { id, record } = recordFromSnapshot(doc, dek, Transaction.isRecord);
	return new Transaction(accountId, id, record);
}

export async function getTransactionsForAccount(
	uid: string,
	account: Account,
	dek: HashStore
): Promise<Dictionary<Transaction>> {
	const snap = await getDocs<TransactionRecordPackage>(transactionsCollection(uid, account));

	const result: Dictionary<Transaction> = {};
	for (const doc of snap.docs) {
		result[doc.id] = transactionFromSnapshot(account.id, doc, dek);
	}
	return result;
}

export async function createTransaction(
	uid: string,
	account: Account,
	record: TransactionRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Transaction> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = doc(transactionsCollection(uid, account));
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return new Transaction(account.id, ref.id, record);
}

export async function updateTransaction(
	uid: string,
	transaction: Transaction,
	dek: HashStore,
	batch?: WriteBatch
): Promise<void> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
	};
	const record: TransactionRecordParams = transaction.toRecord();
	const pkg = encrypt(record, meta, dek);
	const ref = transactionRef(uid, transaction);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteTransaction(
	uid: string,
	transaction: Transaction,
	batch?: WriteBatch
): Promise<void> {
	const ref = transactionRef(uid, transaction);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
