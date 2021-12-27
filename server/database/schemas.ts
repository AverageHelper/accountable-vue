import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";

function isRecord(tbd: unknown): tbd is Record<string, unknown> {
	return (
		tbd !== undefined &&
		tbd !== null &&
		isObject(tbd) &&
		typeof tbd === "object" &&
		!Array.isArray(tbd)
	);
}

export interface MongoObject {
	_id: string;
	uid: string;
}

function isMongoObject(tbd: unknown): tbd is MongoObject {
	// TODO: Use Joi to do this properly
	return (
		isRecord(tbd) &&
		"_id" in tbd &&
		"uid" in tbd &&
		isString((tbd as Record<keyof MongoObject, unknown>)._id) &&
		isString((tbd as Record<keyof MongoObject, unknown>).uid)
	);
}

export interface User extends MongoObject {
	currentAccountId: string;
	passwordHash: string;
	passwordSalt: string;
}

export type Primitive = string | number | boolean | undefined | null;

/**
 * An object whose properties may only be primitive values.
 */
export type DocumentData<T> = {
	[K in keyof T]: Primitive;
};

export interface DataItem extends MongoObject {
	ciphertext: string;
	objectType: string;
}

export function isDataItem(tbd: unknown): tbd is DataItem {
	// TODO: Use Joi to do this properly
	return isMongoObject(tbd) && "ciphertext" in tbd && "objectType" in tbd;
}

export interface Keys extends MongoObject {
	dekMaterial: string;
	passSalt: string;
	oldDekMaterial?: string;
	oldPassSalt?: string;
}

export function isKeys(tbd: unknown): tbd is Keys {
	// TODO: Use Joi to do this properly
	return isMongoObject(tbd) && "dekMaterial" in tbd && "passSalt" in tbd;
}

export type AnyDataItem = DataItem | Keys | User;

export type CollectionID =
	| "accounts"
	| "attachments"
	| "keys"
	| "locations"
	| "tags"
	| "transactions"
	| "users";

const allCollectionIds: ReadonlySet<CollectionID> = new Set([
	"accounts",
	"attachments",
	"keys",
	"locations",
	"tags",
	"transactions",
	"users",
]);

export function isCollectionId(tbd: string): tbd is CollectionID {
	return allCollectionIds.has(tbd as CollectionID);
}
