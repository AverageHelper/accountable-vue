import type { AccountRecordParams } from "../model/Account";
import type { CollectionReference, Firestore } from "firebase/firestore";
import type { TransactionRecordParams } from "../model/Transaction";
import { Account } from "../model/Account";
import { Transaction } from "../model/Transaction";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";

let db: Firestore;

export function bootstrap(): void {
	if (db !== undefined) {
		throw new TypeError("db has already been instantiated");
	}

	const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
	const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
	if (apiKey === undefined || !apiKey) {
		throw new TypeError("No value found for environment key VITE_FIREBASE_API_KEY");
	}
	if (projectId === undefined || !apiKey) {
		throw new TypeError("No value found for environment key VITE_FIREBASE_PROJECT_ID");
	}

	const firebaseApp = initializeApp({
		apiKey,
		projectId,
	});
	db = getFirestore(firebaseApp);
}

// ** Accounts

export async function getAllAccounts(): Promise<Dictionary<Account>> {
	const path = `accounts`;
	const snap = await getDocs<AccountRecordParams>(
		collection(db, path) as CollectionReference<AccountRecordParams>
	);

	const result: Dictionary<Account> = {};
	snap.docs.forEach(doc => {
		const record = doc.data();
		result[doc.id] = new Account(doc.id, record);
	});
	return result;
}

export async function createAccount(record: AccountRecordParams): Promise<Account> {
	const path = `accounts`;
	const ref = await addDoc<AccountRecordParams>(
		collection(db, path) as CollectionReference<AccountRecordParams>,
		record
	);
	return new Account(ref.id, record);
}

// ** Transactions

export async function getTransactionsForAccount(
	account: Account
): Promise<Dictionary<Transaction>> {
	const path = `accounts/${account.id}/transactions`;
	const snap = await getDocs<TransactionRecordParams>(
		collection(db, path) as CollectionReference<TransactionRecordParams>
	);

	const result: Dictionary<Transaction> = {};
	snap.docs.forEach(doc => {
		const record = doc.data();
		result[doc.id] = new Transaction(account.id, doc.id, record);
	});
	return result;
}

export async function createTransaction(
	account: Account,
	record: TransactionRecordParams
): Promise<Transaction> {
	const path = `accounts/${account.id}/transactions`;
	const ref = await addDoc<TransactionRecordParams>(
		collection(db, path) as CollectionReference<TransactionRecordParams>,
		record
	);
	return new Transaction(account.id, ref.id, record);
}
