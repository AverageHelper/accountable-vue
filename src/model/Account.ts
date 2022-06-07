import type { Identifiable } from "./utility/Identifiable";
import isString from "lodash/isString";

export interface AccountRecordParams {
	title: string;
	notes: string | null;
	createdAt: Date;
}

export class Account implements Identifiable<string>, AccountRecordParams {
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
		this.createdAt =
			// handle case where decryption doesn't return a Date object
			(record?.createdAt ? new Date(record.createdAt) : undefined) ?? defaultRecord.createdAt;
	}

	static defaultRecord(this: void, record?: Partial<AccountRecordParams>): AccountRecordParams {
		return {
			title: record?.title ?? `Account ${Math.floor(Math.random() * 10) + 1}`,
			notes: record?.notes ?? null,
			createdAt: record?.createdAt ?? new Date(),
		};
	}

	static isRecord(this: void, toBeDetermined: unknown): toBeDetermined is AccountRecordParams {
		return (
			(toBeDetermined !== undefined &&
				toBeDetermined !== null &&
				typeof toBeDetermined === "object" &&
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

	toRecord(): AccountRecordParams {
		return {
			title: this.title,
			notes: this.notes,
			createdAt: this.createdAt,
		};
	}

	updatedWith(params: Partial<AccountRecordParams>): Account {
		const thisRecord = this.toRecord();
		return new Account(this.id, { ...thisRecord, ...params });
	}

	toString(): string {
		return JSON.stringify(this.toRecord());
	}
}
