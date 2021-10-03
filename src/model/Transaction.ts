import type { Identifiable } from "./utility/Identifiable";

export type TransactionRecordType = "expense" | "income" | "zero";

export interface TransactionRecord extends Identifiable<string> {
	amount: number;
	date: Date;
	title: string | null;
	notes: string | null;
	isReconciled: boolean;
	accountId: string;
}

export type TransactionRecordParams = Omit<TransactionRecord, "id" | "accountId">;

export class Transaction implements TransactionRecord {
	public readonly objectType = "Transaction";
	public readonly id;
	public readonly amount;
	public readonly date;
	public readonly title;
	public readonly notes;
	public readonly isReconciled;
	public readonly accountId;

	constructor(accountId: string, id: string, record?: Partial<TransactionRecordParams>) {
		this.id = id;
		const defaultRecord = Transaction.defaultRecord(record);
		this.amount = record?.amount ?? defaultRecord.amount;
		this.date = record?.date ?? defaultRecord.date;
		this.title = record?.title ?? defaultRecord.title;
		this.notes = record?.notes ?? defaultRecord.notes;
		this.isReconciled = record?.isReconciled ?? defaultRecord.isReconciled;
		this.accountId = accountId;
	}

	get type(): TransactionRecordType {
		if (this.amount > 0) {
			return "income";
		} else if (this.amount < 0) {
			return "expense";
		}
		return "zero";
	}

	static defaultRecord(record?: Partial<TransactionRecordParams>): TransactionRecordParams {
		return {
			amount: record?.amount ?? 0,
			date: record?.date ?? new Date(),
			title: record?.title ?? `Transaction ${Math.floor(Math.random() * 10) + 1}`,
			notes: record?.notes ?? null,
			isReconciled: record?.isReconciled ?? false,
		};
	}

	toRecord(): TransactionRecord {
		return {
			id: this.id,
			amount: this.amount,
			date: this.date,
			title: this.title,
			notes: this.notes,
			isReconciled: this.isReconciled,
			accountId: this.accountId,
		};
	}
}
