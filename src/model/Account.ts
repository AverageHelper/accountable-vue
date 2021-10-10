import type { Identifiable } from "./utility/Identifiable";
import isString from "lodash/isString";

export interface AccountRecord extends Identifiable<string> {
	title: string;
	notes: string | null;
	createdAt: Date;
}

export type AccountRecordParams = Omit<AccountRecord, "id">;

export class Account implements AccountRecord {
	public readonly objectType = "Account";
	public readonly id: string;
	public readonly title: string;
	public readonly notes: string | null;
	public readonly createdAt: Date;

	constructor(id: string, record?: Partial<AccountRecordParams>) {
		this.id = id;
		const defaultRecord = Account.defaultRecord(record);
		this.title = (record?.title?.trim() ?? defaultRecord.title) || defaultRecord.title;
		this.notes = (record?.notes?.trim() ?? "") || defaultRecord.notes;
		this.createdAt = record?.createdAt ?? defaultRecord.createdAt;
	}

	static defaultRecord(record?: Partial<AccountRecordParams>): AccountRecordParams {
		return {
			title: record?.title ?? `Account ${Math.floor(Math.random() * 10) + 1}`,
			notes: record?.notes ?? null,
			createdAt: record?.createdAt ?? new Date(),
		};
	}

	static isRecord(toBeDetermined: unknown): toBeDetermined is AccountRecordParams {
		return (
			(typeof toBeDetermined === "object" &&
				toBeDetermined !== null &&
				toBeDetermined !== undefined &&
				Boolean(toBeDetermined) &&
				!Array.isArray(toBeDetermined) &&
				"createdAt" in toBeDetermined &&
				"title" in toBeDetermined &&
				"notes" in toBeDetermined &&
				(toBeDetermined as AccountRecordParams).title === null) ||
			(isString((toBeDetermined as AccountRecordParams).title) &&
				(toBeDetermined as AccountRecordParams).notes === null) ||
			isString((toBeDetermined as AccountRecordParams).notes)
		);
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
