import type { Identifiable, UUID } from "./utility/Identifiable";
import { uuid } from "./utility/Identifiable";

export type TransactionRecordType = "expense" | "income" | "zero";

export interface TransactionRecord extends Identifiable<UUID> {
	amount: number;
	date: Date;
	title: string | null;
	notes: string | null;
	isReconciled: boolean;
	accountId: string;
}

export class Transaction implements TransactionRecord {
	public readonly objectType = "Transaction";
	public readonly id;
	public readonly amount;
	public readonly date;
	public readonly title;
	public readonly notes;
	public readonly isReconciled;
	public readonly accountId;

	constructor(accountId: string, record?: Partial<Omit<TransactionRecord, "accountId">>) {
		this.id = record?.id ?? uuid();
		this.amount = record?.amount ?? 0;
		this.date = record?.date ?? new Date();
		this.title = record?.title ?? `Transaction ${Math.floor(Math.random() * 10) + 1}`;
		this.notes = record?.notes ?? null;
		this.isReconciled = record?.isReconciled ?? false;
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
