import type { Infer } from "superstruct";
import {
	array,
	boolean,
	date,
	defaulted,
	enums,
	min,
	nullable,
	number,
	object,
	optional,
	string,
} from "superstruct";

// NOTE: TypeScript will say that `default` cases may be undefined, but Superstruct garantees that these values are present. Avoiding `optional` would appease TS, but Superstruct will demand that the key is found, which defeats the point of `default`. Just to be safe, heed TypeScript's warnings as they appear by providing reasonable default values at the use site.

const attachmentSchema = object({
	id: string(),
	title: string(),
	notes: defaulted(optional(nullable(string())), null),
	type: defaulted(optional(string()), "unknown"),
	createdAt: date(),
	storagePath: string(),
});

export type AttachmentSchema = Infer<typeof attachmentSchema>;

const tagSchema = object({
	id: string(),
	name: string(),
	colorId: enums(["red", "orange", "yellow", "green", "blue", "purple"] as const),
});

export type TagSchema = Infer<typeof tagSchema>;

const currencySchema = object({
	code: string(),
	base: number(),
	exponent: min(number(), 0),
});

const amountSchema = object({
	amount: number(),
	currency: currencySchema,
	scale: number(),
});

const transactionSchema = object({
	id: string(),
	amount: amountSchema,
	createdAt: date(),
	title: defaulted(optional(nullable(string())), null),
	notes: defaulted(optional(nullable(string())), null),
	locationId: defaulted(optional(nullable(string())), null),
	isReconciled: defaulted(optional(boolean()), false),
	accountId: string(),
	tagIds: defaulted(optional(array(string())), []),
	attachmentIds: defaulted(optional(array(string())), []),
});

export type TransactionSchema = Infer<typeof transactionSchema>;

const coordinateSchema = object({
	lat: number(),
	lng: number(),
});

const locationSchema = object({
	id: string(),
	title: string(),
	subtitle: defaulted(optional(nullable(string())), null),
	coordinate: defaulted(optional(nullable(coordinateSchema)), null),
	lastUsed: date(),
});

export type LocationSchema = Infer<typeof locationSchema>;

const accountSchema = object({
	id: string(),
	title: string(),
	notes: defaulted(optional(nullable(string())), null),
	createdAt: date(),
	transactions: defaulted(optional(array(transactionSchema)), []),
});

export type AccountSchema = Infer<typeof accountSchema>;

export const schema = object({
	uid: string(),
	locationSensitivity: defaulted(optional(enums(["none", "vague", "specific"] as const)), "none"),
	accounts: defaulted(optional(array(accountSchema)), []),
	attachments: defaulted(optional(array(attachmentSchema)), []),
	locations: defaulted(optional(array(locationSchema)), []),
	tags: defaulted(optional(array(tagSchema)), []),
});

export type DatabaseSchema = Infer<typeof schema>;
