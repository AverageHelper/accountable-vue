import type { AccountRecordParams } from "../model/Account";
import type { EPackage, KeyMaterial } from "./cryption";
import type { TransactionRecordParams } from "../model/Transaction";
import { decrypt, encrypt } from "./cryption";
import { Account } from "../model/Account";
import { Transaction } from "../model/Transaction";
import { initializeApp } from "firebase/app";
import type {
	CollectionReference,
	DocumentReference,
	Firestore,
	Timestamp,
} from "firebase/firestore";
import {
	getFirestore,
	collection,
	doc,
	addDoc,
	setDoc,
	getDoc,
	getDocs,
	deleteField,
	serverTimestamp,
	increment as firestoreIncrement,
	arrayUnion as firestoreArrayUnion,
	arrayRemove as firestoreArrayRemove,
} from "firebase/firestore";
import atob from "atob-lite";

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

function authRef(uid: string): DocumentReference<KeyMaterial> {
	const path = `users/${uid}/keys/main`;
	return doc(db, path) as DocumentReference<KeyMaterial>;
}

function accountsCollection(uid: string): CollectionReference<AccountRecordPackage> {
	const path = `users/${uid}/accounts`;
	return collection(db, path) as CollectionReference<AccountRecordPackage>;
}

function transactionsCollection(
	uid: string,
	accountId: string
): CollectionReference<TransactionRecordPackage> {
	const path = `users/${uid}/accounts/${accountId}/transactions`;
	return collection(db, path) as CollectionReference<TransactionRecordPackage>;
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
export function bootstrap(params?: {
	apiKey?: string;
	authDomain?: string;
	projectId?: string;
}): void {
	if (db !== undefined) {
		throw new TypeError("db has already been instantiated");
	}

	// VITE_ env variables get type definitions in env.d.ts
	const apiKey = params?.apiKey ?? import.meta.env.VITE_FIREBASE_API_KEY;
	const authDomain = params?.authDomain ?? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
	const projectId = params?.projectId ?? import.meta.env.VITE_FIREBASE_PROJECT_ID;

	if (apiKey === undefined || !apiKey) {
		throw new TypeError("No value found for environment variable VITE_FIREBASE_API_KEY");
	}
	if (authDomain === undefined || !authDomain) {
		throw new TypeError("No value found for environment variable VITE_FIREBASE_AUTH_DOMAIN");
	}
	if (projectId === undefined || !projectId) {
		throw new TypeError("No value found for environment variable VITE_FIREBASE_PROJECT_ID");
	}

	const firebaseApp = initializeApp({ apiKey, authDomain, projectId });
	db = getFirestore(firebaseApp);
}

// ** Auth

export async function getAuthMaterial(uid: string): Promise<KeyMaterial | null> {
	const snap = await getDoc(authRef(uid));
	const material = snap.data() ?? null;
	if (material === null) return null;

	return {
		...material,
		passSalt: atob(material.passSalt),
	};
}

export async function setAuthMaterial(uid: string, data: KeyMaterial): Promise<void> {
	await setDoc(authRef(uid), data);
}

// ** Account Records

export async function getAllAccounts(uid: string, key: string): Promise<Dictionary<Account>> {
	const snap = await getDocs(accountsCollection(uid));

	const result: Dictionary<Account> = {};
	for (const doc of snap.docs) {
		const pkg = doc.data();
		const record = decrypt(pkg, key);
		if (!Account.isRecord(record)) {
			throw new TypeError(`Failed to parse transaction record from Firestore document ${doc.id}`);
		}
		result[doc.id] = new Account(doc.id, record);
	}
	return result;
}

export async function createAccount(
	uid: string,
	record: AccountRecordParams,
	key: string
): Promise<Account> {
	const meta: AccountRecordPackageMetadata = {
		objectType: "Account",
	};
	const pkg = encrypt(record, meta, key);
	const ref = await addDoc(accountsCollection(uid), pkg);
	return new Account(ref.id, record);
}

// ** Transaction Records

export async function getTransactionsForAccount(
	uid: string,
	account: Account,
	key: string
): Promise<Dictionary<Transaction>> {
	const snap = await getDocs(transactionsCollection(uid, account.id));

	const result: Dictionary<Transaction> = {};
	for (const doc of snap.docs) {
		const pkg = doc.data();
		const record = decrypt(pkg, key);
		if (!Transaction.isRecord(record)) {
			throw new TypeError(`Failed to parse transaction record from Firestore document ${doc.id}`);
		}
		result[doc.id] = new Transaction(account.id, doc.id, record);
	}
	return result;
}

export async function createTransaction(
	uid: string,
	account: Account,
	record: TransactionRecordParams,
	key: string
): Promise<Transaction> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
		createdAt: record.createdAt,
	};
	const pkg = encrypt(record, meta, key);
	const ref = await addDoc(transactionsCollection(uid, account.id), pkg);
	return new Transaction(account.id, ref.id, record);
}
