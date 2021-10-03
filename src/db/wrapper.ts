import type { AccountRecord } from "../model/Account";
import type { Adapter } from "lowdb";
import type { TransactionRecord } from "../model/Transaction";
import { Account } from "../model/Account";
import { Transaction } from "../model/Transaction";
import { Low, JSONFile, Memory } from "lowdb";
// import { resolve } from "path";

interface Data {
	/** All accounts */
	accounts: Dictionary<AccountRecord>;
	/** All transactions by account ID */
	transactions: Dictionary<Dictionary<TransactionRecord>>;
}

let db: Low<Data>;

export function bootstrap(adapter?: Adapter<Data>): void {
	if (db !== undefined) {
		throw new TypeError("db has already been instantiated");
	}
	// const file = resolve(__dirname, "../../db.json");
	db = new Low<Data>(adapter ?? new Memory<Data>());
}

const defaultData: () => Data = () => ({
	accounts: {},
	transactions: {},
});

// ** Accounts

export async function getAllAccounts(): Promise<Dictionary<Account>> {
	await db.read();
	db.data ??= defaultData();

	const records = db.data.accounts ?? {};
	const result: Dictionary<Account> = {};
	Object.entries(records).forEach(([id, record]) => {
		result[id] = new Account(record);
	});
	return result;
}

export async function putAccount(account: Account): Promise<void> {
	await db.read();
	db.data ??= defaultData();

	const record = account.toRecord();
	db.data.accounts[account.id] = record;

	await db.write();
}

// ** Transactions

export async function getTransactionsForAccount(
	account: Account
): Promise<Dictionary<Transaction>> {
	await db.read();
	db.data ??= defaultData();

	const records = db.data.transactions[account.id] ?? {};
	const result: Dictionary<Transaction> = {};
	Object.entries(records).forEach(([id, record]) => {
		result[id] = new Transaction(account.id, record);
	});
	return result;
}

export async function putTransaction(transaction: Transaction, account: Account): Promise<void> {
	await db.read();
	db.data ??= defaultData();

	const record = transaction.toRecord();
	const transactions = db.data.transactions[account.id] ?? {};
	transactions[transaction.id] = record;
	db.data.transactions[account.id] = transactions;

	await db.write();
}
