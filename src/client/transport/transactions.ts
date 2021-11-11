import type { Account } from "../model/Account";
import type { EPackage, HashStore } from "./cryption";
import type { TransactionRecordParams } from "../model/Transaction";
import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, recordFromSnapshot } from "./db";
import { encrypt } from "./cryption";
import { Transaction } from "../model/Transaction";
import { collection, doc, addDoc, setDoc, deleteDoc, getDocs } from "firebase/firestore";

interface TransactionRecordPackageMetadata {
	objectType: "Transaction";
}
type TransactionRecordPackage = EPackage<TransactionRecordPackageMetadata>;

function transactionRef(
	uid: string,
	transaction: Transaction
): DocumentReference<TransactionRecordPackage> {
	const { accountId, id } = transaction;
	const path = `users/${uid}/accounts/${accountId}/transactions/${id}`;
	return doc(db, path) as DocumentReference<TransactionRecordPackage>;
}

export function transactionsCollection(
	uid: string,
	account: Account
): CollectionReference<TransactionRecordPackage> {
	const path = `users/${uid}/accounts/${account.id}/transactions`;
	return collection(db, path) as CollectionReference<TransactionRecordPackage>;
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
	const snap = await getDocs(transactionsCollection(uid, account));

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
	dek: HashStore
): Promise<Transaction> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = await addDoc(transactionsCollection(uid, account), pkg);
	return new Transaction(account.id, ref.id, record);
}

export async function updateTransaction(
	uid: string,
	transaction: Transaction,
	dek: HashStore
): Promise<void> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
	};
	const record: TransactionRecordParams = {
		createdAt: transaction.createdAt,
		notes: transaction.notes,
		title: transaction.title,
		locationId: transaction.locationId,
		amount: transaction.amount,
		isReconciled: transaction.isReconciled,
		accountId: transaction.accountId,
		tagIds: transaction.tagIds,
		attachmentIds: transaction.attachmentIds,
	};
	const pkg = encrypt(record, meta, dek);
	await setDoc(transactionRef(uid, transaction), pkg);
}

export async function deleteTransaction(uid: string, transaction: Transaction): Promise<void> {
	await deleteDoc(transactionRef(uid, transaction));
}
