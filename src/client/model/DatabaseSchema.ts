import Joi from "joi";
import "joi-extract-type";

// NOTE: TypeScript will say that `default` cases may be undefined, but Joi garantees that these values are present. Using `required` would appease TS, but Joi will demand that the key is found, which defeats the point of `default`. Just to be safe, heed TypeScript's warnings as they appear by providing reasonable default values at the site.

const attachmentSchema = Joi.object({
	id: Joi.string().required(),
	title: Joi.string().required(),
	notes: Joi.string().allow(null, "").default(null),
	type: Joi.string().default("unknown"),
	createdAt: Joi.date().required(),
	storagePath: Joi.string().required(),
});

export type AttachmentSchema = Joi.extractType<typeof attachmentSchema>;

const tagSchema = Joi.object({
	id: Joi.string().required(),
	name: Joi.string().allow("").required(),
	colorId: Joi.string().valid("red", "orange", "yellow", "green", "blue", "purple").required(),
});

export type TagSchema = Joi.extractType<typeof tagSchema>;

const currencySchema = Joi.object({
	code: Joi.string().required(),
	base: Joi.number().required(),
	exponent: Joi.number().min(0).required(),
});

const amountSchema = Joi.object({
	amount: Joi.number().required(),
	currency: currencySchema.required(),
	scale: Joi.number().required(),
});

const transactionSchema = Joi.object({
	id: Joi.string().required(),
	amount: amountSchema.required(),
	createdAt: Joi.date().required(),
	title: Joi.string().allow(null).default(null),
	notes: Joi.string().allow(null, "").default(null),
	locationId: Joi.string().allow(null, "").default(null),
	isReconciled: Joi.boolean().default(false),
	accountId: Joi.string().required(),
	tagIds: Joi.array().items(Joi.string()).default([]),
	attachmentIds: Joi.array().items(Joi.string()).default([]),
});

export type TransactionSchema = Joi.extractType<typeof transactionSchema>;

const coordinateSchema = Joi.object({
	lat: Joi.number().required(),
	lng: Joi.number().required(),
});

const locationSchema = Joi.object({
	id: Joi.string().required(),
	title: Joi.string().required(),
	subtitle: Joi.string().allow(null, "").default(null),
	coordinate: coordinateSchema.allow(null).default(null),
	lastUsed: Joi.date().required(),
});

export type LocationSchema = Joi.extractType<typeof locationSchema>;

const accountSchema = Joi.object({
	id: Joi.string().required(),
	title: Joi.string().required(),
	notes: Joi.string().allow(null, "").default(null),
	createdAt: Joi.date().required(),
	transactions: Joi.array().items(transactionSchema).default([]),
});

export type AccountSchema = Joi.extractType<typeof accountSchema>;

export const schema = Joi.object({
	uid: Joi.string().required(),
	locationSensitivity: Joi.string().valid("none", "vague", "specific").default("none"),
	accounts: Joi.array().items(accountSchema).default([]),
	attachments: Joi.array().items(attachmentSchema).default([]),
	locations: Joi.array().items(locationSchema).default([]),
	tags: Joi.array().items(tagSchema).default([]),
});

export type DatabaseSchema = Joi.extractType<typeof schema>;
