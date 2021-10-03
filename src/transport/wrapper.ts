import type { AccountRecordParams } from "../model/Account";
import type { CollectionReference, Firestore, Timestamp } from "firebase/firestore";
import type { EPackage } from "./cryption";
import type { TransactionRecordParams } from "../model/Transaction";
import { Account } from "../model/Account";
import { Transaction } from "../model/Transaction";
import { initializeApp } from "firebase/app";
import {
	getFirestore,
	collection,
	addDoc,
	getDocs,
	deleteField,
	serverTimestamp,
	increment as firestoreIncrement,
	arrayUnion as firestoreArrayUnion,
	arrayRemove as firestoreArrayRemove,
} from "firebase/firestore";

// ** Firebase Setup

let db: Firestore;

interface AccountRecordPackageMetadata {
	objectType: "Account";
}
type AccountRecordPackage = EPackage<AccountRecordPackageMetadata>;

interface TransactionRecordPackageMetadata {
	objectType: "Transaction";
	createdAt: Date;
}
type TransactionRecordPackage = EPackage<TransactionRecordPackageMetadata>;

function accountsCollection(): CollectionReference<AccountRecordParams> {
	const path = `accounts`;
	return collection(db, path) as CollectionReference<AccountRecordParams>;
}

function transactionsCollection(accountId: string): CollectionReference<TransactionRecordParams> {
	const path = `accounts/${accountId}/transactions`;
	return collection(db, path) as CollectionReference<TransactionRecordParams>;
}

export { Timestamp };
export const DELETE = deleteField();
export const TIMESTAMP = serverTimestamp() as unknown as Timestamp;
export function increment(step: number): number {
	return firestoreIncrement(step) as unknown as number;
}
export function arrayUnion<T>(...elements: Array<T>): Array<T> {
	return firestoreArrayUnion(...elements) as unknown as Array<T>;
}
export function arrayRemove<T>(...elements: Array<T>): Array<T> {
	return firestoreArrayRemove(elements) as unknown as Array<T>;
}
export const merge = { merge: true };

/**
 * Bootstrap our Firebase app using either environment variables or provided params.
 *
 * @param params Values to use instead of environment variables to instantiate Firebase.
 */
export function bootstrap(params?: { apiKey?: string; projectId?: string }): void {
	if (db !== undefined) {
		throw new TypeError("db has already been instantiated");
	}

	// VITE_ env variables get type definitions in env.d.ts
	const apiKey = params?.apiKey ?? import.meta.env.VITE_FIREBASE_API_KEY;
	const projectId = params?.projectId ?? import.meta.env.VITE_FIREBASE_PROJECT_ID;
	if (apiKey === undefined || !apiKey) {
		throw new TypeError("No value found for environment variable VITE_FIREBASE_API_KEY");
	}
	if (projectId === undefined || !apiKey) {
		throw new TypeError("No value found for environment variable VITE_FIREBASE_PROJECT_ID");
	}

	const firebaseApp = initializeApp({ apiKey, projectId });
	db = getFirestore(firebaseApp);
}

// ** Account Records

export async function getAllAccounts(): Promise<Dictionary<Account>> {
	const snap = await getDocs(accountsCollection());

	const result: Dictionary<Account> = {};
	snap.docs.forEach(doc => {
		const record = doc.data();
		result[doc.id] = new Account(doc.id, record);
	});
	return result;
}

export async function createAccount(record: AccountRecordParams): Promise<Account> {
	const ref = await addDoc(accountsCollection(), record);
	return new Account(ref.id, record);
}

// ** Transaction Records

export async function getTransactionsForAccount(
	account: Account
): Promise<Dictionary<Transaction>> {
	const snap = await getDocs(transactionsCollection(account.id));

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
	const ref = await addDoc(transactionsCollection(account.id), record);
	return new Transaction(account.id, ref.id, record);
}
