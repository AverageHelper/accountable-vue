import type { Identifiable } from "./utility/Identifiable";

export interface AccountRecord extends Identifiable<string> {
	title: string;
	notes: string | null;
	createdAt: Date;
}

export type AccountRecordParams = Omit<AccountRecord, "id">;

export class Account implements AccountRecord {
	public readonly objectType = "Account";
	public readonly id;
	public readonly title;
	public readonly notes;
	public readonly createdAt;

	constructor(id: string, record?: Partial<AccountRecordParams>) {
		this.id = id;
		const defaultRecord = Account.defaultRecord(record);
		this.title = record?.title ?? defaultRecord.title;
		this.notes = record?.notes ?? defaultRecord.notes;
		this.createdAt = record?.createdAt ?? defaultRecord.createdAt;
	}

	static defaultRecord(record?: Partial<AccountRecordParams>): AccountRecordParams {
		return {
			title: record?.title ?? `Account ${Math.floor(Math.random() * 10) + 1}`,
			notes: record?.notes ?? null,
			createdAt: record?.createdAt ?? new Date(),
		};
	}

	toRecord(): AccountRecord {
		return {
			id: this.id,
			title: this.title,
			notes: this.notes,
			createdAt: this.createdAt,
		};
	}
}
