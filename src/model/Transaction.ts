import type { Attachment } from "./Attachment";
import type { Currency, Dinero, DineroSnapshot } from "dinero.js";
import type { Model } from "./utility/Model";
import type { Tag } from "./Tag";
import isBoolean from "lodash/isBoolean";
import isDate from "lodash/isDate";
import isNumber from "lodash/isNumber";
import isString from "lodash/isString";
import { dinero, toSnapshot } from "dinero.js";
import { USD } from "@dinero.js/currencies";

function isStringOrNull(tbd: unknown): tbd is string | null {
	return tbd === null || isString(tbd);
}

// TODO: Add a date-last-modified field to this and every stored document (so database lurkers can't correlate data modifications to encrypted representations)

export interface Transaction extends Model<"Transaction"> {
	amount: Dinero<number>;
	createdAt: Date;
	title: string | null;
	notes: string | null;
	locationId: string | null;
	isReconciled: boolean;
	accountId: string;
	tagIds: Array<string>;
	attachmentIds: Array<string>;
}

export type TransactionRecordParams = ReplaceWith<
	Pick<
		Transaction,
		| "accountId"
		| "amount"
		| "attachmentIds"
		| "createdAt"
		| "isReconciled"
		| "locationId"
		| "notes"
		| "tagIds"
		| "title"
	>,
	"amount",
	DineroSnapshot<number>
>;

export function transaction(
	params: Transaction | (TransactionRecordParams & Pick<Transaction, "id">)
): Transaction {
	if ("objectType" in params) {
		return newTransactionWithDelta(params, {});
	}
	return {
		id: params.id,
		objectType: "Transaction",
		accountId: params.accountId,
		amount:
			typeof params.amount === "number"
				? dinero({ amount: params.amount * 100, currency: USD }) // for compatibility. # TODO: Migrate ancient transactions
				: dinero(params.amount),
		createdAt: params.createdAt,
		title: (params.title?.trim() ?? "") || null,
		notes: (params.notes?.trim() ?? "") || null,
		locationId: (params.locationId?.trim() ?? "") || null,
		isReconciled: params.isReconciled,
		tagIds: Array.from(new Set(params.tagIds)),
		attachmentIds: Array.from(new Set(params.attachmentIds)),
	};
}

function isCurrency(tbd: unknown): tbd is Currency<number> {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"code" in tbd &&
		"base" in tbd &&
		"exponent" in tbd &&
		isString((tbd as Currency<number>).code) &&
		isNumber((tbd as Currency<number>).base) &&
		isNumber((tbd as Currency<number>).exponent)
	);
}

function isAmountSnapshot(tbd: unknown): tbd is DineroSnapshot<number> {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"amount" in tbd &&
		"currency" in tbd &&
		"scale" in tbd &&
		isNumber((tbd as DineroSnapshot<number>).amount) &&
		isNumber((tbd as DineroSnapshot<number>).scale) &&
		isCurrency((tbd as DineroSnapshot<number>).currency)
	);
}

export function isTransactionRecord(tbd: unknown): tbd is TransactionRecordParams {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"amount" in tbd &&
		"createdAt" in tbd &&
		"isReconciled" in tbd &&
		"title" in tbd &&
		"notes" in tbd &&
		"locationId" in tbd &&
		isStringOrNull((tbd as TransactionRecordParams).title) &&
		isStringOrNull((tbd as TransactionRecordParams).notes) &&
		isStringOrNull((tbd as TransactionRecordParams).locationId) &&
		isAmountSnapshot((tbd as TransactionRecordParams).amount) &&
		isBoolean((tbd as TransactionRecordParams).isReconciled) &&
		isDate((tbd as TransactionRecordParams).createdAt)
	);
}

/**
 * Creates a new {@link Transaction} by combining the properties of the given transaction with the given properties.
 * @param ogTransaction The original transaction.
 * @param delta The properties to apply to the new transaction. An empty value duplicates the transaction.
 */
export function newTransactionWithDelta(
	ogTransaction: Transaction,
	delta: Partial<TransactionRecordParams>
): Transaction {
	const thisRecord = recordFromTransaction(ogTransaction);
	return transaction({
		id: ogTransaction.id,
		...thisRecord,
		...delta,
	});
}

export function recordFromTransaction(transaction: Transaction): TransactionRecordParams {
	return {
		amount: toSnapshot(transaction.amount),
		createdAt: transaction.createdAt,
		title: transaction.title,
		notes: transaction.notes,
		locationId: transaction.locationId,
		isReconciled: transaction.isReconciled,
		accountId: transaction.accountId,
		tagIds: Array.from(new Set(transaction.tagIds)),
		attachmentIds: Array.from(new Set(transaction.attachmentIds)),
	};
}

export function addTagToTransaction(transaction: Transaction, tag: Tag): void {
	const tagIdx = transaction.tagIds.indexOf(tag.id);
	if (tagIdx === -1) {
		// tag not found, so add it!
		transaction.tagIds.push(tag.id);
	}
}

export function removeTagFromTransaction(transaction: Transaction, tag: Tag): void {
	const tagIdx = transaction.tagIds.indexOf(tag.id);
	if (tagIdx !== -1) {
		// tag found, so remove it!
		transaction.tagIds.splice(tagIdx, 1);
	}
}

export function addAttachmentToTransaction(transaction: Transaction, file: Attachment): void {
	const fileIdx = transaction.attachmentIds.indexOf(file.id);
	if (fileIdx === -1) {
		// file not found, so add it!
		transaction.attachmentIds.push(file.id);
	}
}

export function removeAttachmentIdFromTransaction(transaction: Transaction, fileId: string): void {
	const fileIdx = transaction.attachmentIds.indexOf(fileId);
	if (fileIdx !== -1) {
		// file found, so remove it!
		transaction.attachmentIds.splice(fileIdx, 1);
	}
}
