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

function transactionRef(transaction: Transaction): DocumentReference<TransactionRecordPackage> {
	const id = transaction.id;
	return doc<TransactionRecordPackage>(db, "transactions", id);
}

export function transactionsCollection(): CollectionReference<TransactionRecordPackage> {
	return collection<TransactionRecordPackage>(db, "transactions");
}

export function transactionFromSnapshot(
	doc: QueryDocumentSnapshot<TransactionRecordPackage>,
	dek: HashStore
): Transaction {
	const { id, record } = recordFromSnapshot(doc, dek, Transaction.isRecord);
	return new Transaction(id, record);
}

export async function getTransactionsForAccount(
	account: Account,
	dek: HashStore
): Promise<Dictionary<Transaction>> {
	const snap = await getDocs<TransactionRecordPackage>(transactionsCollection());

	const result: Dictionary<Transaction> = {};
	for (const doc of snap.docs) {
		const transaction = transactionFromSnapshot(doc, dek);
		if (transaction.accountId === account.id) {
			result[doc.id] = transaction;
		}
	}
	return result;
}

export async function createTransaction(
	record: TransactionRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Transaction> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = doc(transactionsCollection());
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return new Transaction(ref.id, record);
}

export async function updateTransaction(
	transaction: Transaction,
	dek: HashStore,
	batch?: WriteBatch
): Promise<void> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
	};
	const record: TransactionRecordParams = transaction.toRecord();
	const pkg = encrypt(record, meta, dek);
	const ref = transactionRef(transaction);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteTransaction(
	transaction: Transaction,
	batch?: WriteBatch
): Promise<void> {
	const ref = transactionRef(transaction);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
