import type { AccountRecordParams } from "../model/Account";
import type { EPackage, HashStore, KeyMaterial } from "./cryption";
import type { TransactionRecordParams } from "../model/Transaction";
import type { Unsubscribe } from "firebase/auth";
import { Account } from "../model/Account";
import { decrypt, encrypt } from "./cryption";
import { initializeApp } from "firebase/app";
import { Transaction } from "../model/Transaction";
import { useJobQueue, forgetJobQueue } from "@averagehelper/job-queue";
import type {
	CollectionReference,
	DocumentReference,
	Firestore,
	FirestoreError,
	QuerySnapshot,
	QueryDocumentSnapshot,
	Timestamp,
} from "firebase/firestore";
import {
	getFirestore,
	collection,
	doc,
	addDoc,
	setDoc,
	deleteDoc,
	getDoc,
	getDocs,
	onSnapshot,
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

function authRef(uid: string): DocumentReference<KeyMaterial> {
	const path = `users/${uid}/keys/main`;
	return doc(db, path) as DocumentReference<KeyMaterial>;
}

function accountsCollection(uid: string): CollectionReference<AccountRecordPackage> {
	const path = `users/${uid}/accounts`;
	return collection(db, path) as CollectionReference<AccountRecordPackage>;
}

function accountRef(uid: string, accountId: string): DocumentReference<AccountRecordPackage> {
	const path = `users/${uid}/accounts/${accountId}`;
	return doc(db, path) as DocumentReference<AccountRecordPackage>;
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

export function isWrapperInstantiated(): boolean {
	return db !== undefined;
}

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
	if (isWrapperInstantiated()) {
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

	return material;
}

export async function setAuthMaterial(uid: string, data: KeyMaterial): Promise<void> {
	await setDoc(authRef(uid), data);
}

// ** Account Records

export function watchAllAccounts(
	uid: string,
	onSnap: (snap: QuerySnapshot<AccountRecordPackage>) => void | Promise<void>,
	onError?: ((error: FirestoreError) => void) | undefined,
	onCompletion?: (() => void) | undefined
): Unsubscribe {
	const queueId = `watchAllAccounts-${uid}`;
	const queue = useJobQueue<QuerySnapshot<AccountRecordPackage>>(queueId);
	queue.process(onSnap);
	const unsubscribe = onSnapshot(
		accountsCollection(uid),
		snap => queue.createJob(snap),
		onError,
		onCompletion
	);

	return (): void => {
		unsubscribe();
		forgetJobQueue(queueId);
	};
}

export function accountFromSnapshot(
	doc: QueryDocumentSnapshot<AccountRecordPackage>,
	dek: HashStore
): Account {
	const pkg = doc.data();
	const record = decrypt(pkg, dek);
	if (!Account.isRecord(record)) {
		throw new TypeError(`Failed to parse transaction record from Firestore document ${doc.id}`);
	}
	return new Account(doc.id, record);
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
	await setDoc(accountRef(uid, account.id), pkg);
}

export async function deleteAccount(uid: string, account: Account): Promise<void> {
	await deleteDoc(accountRef(uid, account.id));
	// TODO: Make sure this handles transactions
}

// ** Transaction Records

export async function getTransactionsForAccount(
	uid: string,
	account: Account,
	dek: HashStore
): Promise<Dictionary<Transaction>> {
	const snap = await getDocs(transactionsCollection(uid, account.id));

	const result: Dictionary<Transaction> = {};
	for (const doc of snap.docs) {
		const pkg = doc.data();
		const record = decrypt(pkg, dek);
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
	dek: HashStore
): Promise<Transaction> {
	const meta: TransactionRecordPackageMetadata = {
		objectType: "Transaction",
		createdAt: record.createdAt,
	};
	const pkg = encrypt(record, meta, dek);
	const ref = await addDoc(transactionsCollection(uid, account.id), pkg);
	return new Transaction(account.id, ref.id, record);
}
