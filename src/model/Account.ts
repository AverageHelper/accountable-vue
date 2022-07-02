import type { Model } from "./utility/Model";
import isDate from "lodash/isDate";
import isString from "lodash/isString";

function isStringOrNull(tbd: unknown): tbd is string | null {
	return tbd === null || isString(tbd);
}

export interface Account extends Model<"Account"> {
	readonly title: string;
	readonly notes: string | null;
	readonly createdAt: Date;
}

export type AccountRecordParams = Pick<Account, "createdAt" | "notes" | "title">;

export function account(params: Omit<Account, "objectType">): Account {
	return {
		createdAt: new Date(params.createdAt), // in case this is actually a string
		id: params.id,
		notes: (params.notes?.trim() ?? "") || null,
		objectType: "Account",
		title: params.title.trim() || `Account ${Math.floor(Math.random() * 10) + 1}`, // TODO: I18N
	};
}

export function isAccountRecord(tbd: unknown): tbd is AccountRecordParams {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"createdAt" in tbd &&
		"title" in tbd &&
		"notes" in tbd &&
		isString((tbd as AccountRecordParams).title) &&
		isStringOrNull((tbd as AccountRecordParams).notes) &&
		(isDate((tbd as AccountRecordParams).createdAt) ||
			isString((tbd as AccountRecordParams).createdAt))
	);
}

export function recordFromAccount(account: Account): AccountRecordParams {
	return {
		title: account.title,
		notes: account.notes,
		createdAt: account.createdAt,
	};
}
