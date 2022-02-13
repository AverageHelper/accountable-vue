import type { Dinero, DineroSnapshot } from "dinero.js";
import type { Identifiable } from "./utility/Identifiable";
import isString from "lodash/isString";
import isBoolean from "lodash/isBoolean";
import { dinero, toSnapshot, isPositive, isNegative, isZero } from "dinero.js";
import { USD } from "@dinero.js/currencies";

export type TransactionRecordType = "expense" | "income" | "transaction";

// TODO: Add a date-last-modified field to this and every stored document (so database lurkers can't correlate data modifications to encrypted representations)

export interface TransactionRecordParams {
	amount: DineroSnapshot<number>;
	createdAt: Date;
	title: string | null;
	notes: string | null;
	locationId: string | null;
	isReconciled: boolean;
	accountId: string;
	tagIds: ReadonlyArray<string>;
	attachmentIds: ReadonlyArray<string>;
}

export class Transaction
	implements Identifiable<string>, ReplaceWith<TransactionRecordParams, "amount", Dinero<number>>
{
	public readonly objectType = "Transaction";
	public readonly id: string;
	public readonly amount: Dinero<number>;
	public readonly createdAt: Date;
	public readonly title: string | null;
	public readonly notes: string | null;
	public readonly locationId: string | null;
	public readonly isReconciled: boolean;
	public readonly accountId: string;
	private readonly _tagIds: Set<string>;
	private readonly _attachmentIds: Set<string>;

	constructor(
		id: string,
		record: Partial<TransactionRecordParams> & Pick<TransactionRecordParams, "accountId">
	) {
		this.id = id;
		this.accountId = record.accountId;
		const defaultRecord = Transaction.defaultRecord(record);
		this.amount =
			typeof record?.amount === "number"
				? dinero({ amount: record.amount * 100, currency: USD }) // for compatibility
				: dinero(record?.amount ?? defaultRecord.amount);
		this.createdAt =
			// handle case where decryption doesn't return a Date object
			(record?.createdAt ? new Date(record.createdAt) : undefined) ?? defaultRecord.createdAt;
		this.title = (record?.title?.trim() ?? "") || defaultRecord.title;
		this.notes = (record?.notes?.trim() ?? "") || defaultRecord.notes;
		this.locationId = (record?.locationId?.trim() ?? "") || defaultRecord.locationId;
		this.isReconciled = record?.isReconciled ?? defaultRecord.isReconciled;
		this._tagIds = new Set(record?.tagIds ?? defaultRecord.tagIds);
		this._attachmentIds = new Set(record?.attachmentIds ?? defaultRecord.attachmentIds);
	}

	get type(): TransactionRecordType {
		const TRANSACTION = "transaction";
		const INCOME = "income";
		const EXPENSE = "expense";

		if (isZero(this.amount)) {
			return TRANSACTION;
		} else if (isPositive(this.amount)) {
			return INCOME;
		} else if (isNegative(this.amount)) {
			return EXPENSE;
		}
		return TRANSACTION;
	}

	get tagIds(): ReadonlyArray<string> {
		return new Array(...this._tagIds);
	}

	get attachmentIds(): ReadonlyArray<string> {
		return new Array(...this._attachmentIds);
	}

	static defaultRecord(
		this: void,
		record?: Partial<TransactionRecordParams>
	): Omit<TransactionRecordParams, "accountId"> {
		return {
			amount: record?.amount ?? toSnapshot(dinero({ amount: 0, currency: USD })),
			createdAt: record?.createdAt ?? new Date(),
			title: (record?.title ?? "") || null,
			notes: (record?.notes ?? "") || null,
			locationId: (record?.locationId ?? "") || null,
			isReconciled: record?.isReconciled ?? false,
			tagIds: [],
			attachmentIds: [],
		};
	}

	static isRecord(this: void, toBeDetermined: unknown): toBeDetermined is TransactionRecordParams {
		return (
			typeof toBeDetermined === "object" &&
			toBeDetermined !== null &&
			toBeDetermined !== undefined &&
			Boolean(toBeDetermined) &&
			!Array.isArray(toBeDetermined) &&
			"amount" in toBeDetermined &&
			"createdAt" in toBeDetermined &&
			"title" in toBeDetermined &&
			((toBeDetermined as TransactionRecordParams).title === null ||
				isString((toBeDetermined as TransactionRecordParams).title)) &&
			"notes" in toBeDetermined &&
			((toBeDetermined as TransactionRecordParams).notes === null ||
				isString((toBeDetermined as TransactionRecordParams).notes)) &&
			"locationId" in toBeDetermined &&
			((toBeDetermined as TransactionRecordParams).locationId === null ||
				isString((toBeDetermined as TransactionRecordParams).locationId)) &&
			"isReconciled" in toBeDetermined &&
			isBoolean((toBeDetermined as TransactionRecordParams).isReconciled)
		);
	}

	toRecord(): ReplaceWith<TransactionRecordParams, "attachmentIds" | "tagIds", Array<string>> {
		return {
			amount: toSnapshot(this.amount),
			createdAt: this.createdAt,
			title: this.title,
			notes: this.notes,
			locationId: this.locationId,
			isReconciled: this.isReconciled,
			accountId: this.accountId,
			tagIds: this.tagIds as Array<string>,
			attachmentIds: this.attachmentIds as Array<string>,
		};
	}

	copy(): Transaction {
		return this.updatedWith({});
	}

	updatedWith(params: Partial<TransactionRecordParams>): Transaction {
		const thisRecord = this.toRecord();
		return new Transaction(this.id, {
			...thisRecord,
			...params,
		});
	}

	addTagId(id: string): void {
		this._tagIds.add(id);
	}

	removeTagId(id: string): void {
		this._tagIds.delete(id);
	}

	addAttachmentId(id: string): void {
		this._attachmentIds.add(id);
	}

	removeAttachmentId(id: string): void {
		this._attachmentIds.delete(id);
	}

	toString(): string {
		return JSON.stringify(this.toRecord());
	}
}
