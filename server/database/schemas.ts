import type { ValueIteratorTypeGuard } from "lodash";
import isArray from "lodash/isArray.js";
import Joi from "joi";
import mongoose from "mongoose";
import "joi-extract-type";

export function isArrayOf<T>(
	tbd: unknown,
	elementGuard: ValueIteratorTypeGuard<unknown, T>
): tbd is Array<T> {
	return isArray(tbd) && tbd.every(elementGuard);
}

export function isNonEmptyArray<T>(tbd: Array<T>): tbd is NonEmptyArray<T> {
	return tbd.length > 0;
}

function isValidForSchema(data: unknown, schema: Joi.AnySchema): boolean {
	const { error } = schema.validate(data);
	return !error;
}

const jwtPayload = Joi.object({
	uid: Joi.string().required(),
	hash: Joi.string(),
}).unknown(true);

export type JwtPayload = Joi.extractType<typeof jwtPayload>;

export function isJwtPayload(tbd: unknown): tbd is JwtPayload {
	return isValidForSchema(tbd, jwtPayload);
}

const user = Joi.object({
	uid: Joi.string().required(),
	currentAccountId: Joi.string().required(),
	passwordHash: Joi.string().required(),
	passwordSalt: Joi.string().required(),
});
export type User = Joi.extractType<typeof user>;

export type Primitive = string | number | boolean | undefined | null;

/**
 * An object whose properties may only be primitive values.
 */
export type DocumentData<T> = {
	[K in keyof T]: Primitive;
};

const dataItem = Joi.object({
	ciphertext: Joi.string().required(),
	objectType: Joi.string().required(),
	cryption: Joi.string().valid("v0", "v1"),
});
export type DataItem = Joi.extractType<typeof dataItem>;

export function isDataItem(tbd: unknown): tbd is DataItem {
	return isValidForSchema(tbd, dataItem);
}

const userKeys = Joi.object({
	dekMaterial: Joi.string().required(),
	passSalt: Joi.string().required(),
	oldDekMaterial: Joi.string(),
	oldPassSalt: Joi.string(),
});
export type UserKeys = Joi.extractType<typeof userKeys>;

export function isUserKeys(tbd: unknown): tbd is UserKeys {
	return isValidForSchema(tbd, userKeys);
}

export type AnyDataItem = DataItem | UserKeys | User;

const allCollectionIds = [
	"accounts",
	"attachments",
	"keys",
	"locations",
	"tags",
	"transactions",
	"users",
] as const;

export type CollectionID = typeof allCollectionIds[number];

export function isCollectionId(tbd: string): tbd is CollectionID {
	return allCollectionIds.includes(tbd as CollectionID);
}

const dataItemSchema = new mongoose.Schema<DataItem & { uid: string }>({
	uid: { type: String, required: true },
	ciphertext: { type: String, required: true },
	objectType: { type: String, required: true },
});

const keysSchema = new mongoose.Schema<UserKeys & { uid: string }>({
	uid: { type: String, required: true },
	dekMaterial: { type: String, required: true },
	passSalt: { type: String, required: true },
	oldDekMaterial: String,
	oldPassSalt: String,
});

const userSchema = new mongoose.Schema<User>({
	uid: { type: String, required: true },
	currentAccountId: { type: String, required: true },
	passwordHash: { type: String, required: true },
	passwordSalt: { type: String, required: true },
});

export const AccountModel = mongoose.model("Account", dataItemSchema);
export const AttachmentModel = mongoose.model("Attachment", dataItemSchema);
export const KeysModel = mongoose.model("Keys", keysSchema);
export const LocationModel = mongoose.model("Location", dataItemSchema);
export const TagModel = mongoose.model("Tag", dataItemSchema);
export const TransactionModel = mongoose.model("Transaction", dataItemSchema);
export const UserModel = mongoose.model("User", userSchema);

const documentRef = Joi.object({
	collectionId: Joi.string()
		.valid(...allCollectionIds)
		.required(),
	documentId: Joi.string().required(),
});

const setBatch = Joi.object({
	type: Joi.string().valid("set").required(),
	ref: documentRef.required(),
	data: dataItem.required(),
});

const deleteBatch = Joi.object({
	type: Joi.string().valid("delete").required(),
	ref: documentRef.required(),
});

const documentWriteBatch = Joi.alt(setBatch, deleteBatch);
export type DocumentWriteBatch = Joi.extractType<typeof documentWriteBatch>;

export function isDocumentWriteBatch(tbd: unknown): tbd is DocumentWriteBatch {
	return isValidForSchema(tbd, documentWriteBatch);
}

export type Identified<T> = T & { _id: string };
export type IdentifiedDataItem = Identified<DataItem> | Identified<UserKeys> | User;
