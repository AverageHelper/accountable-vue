import Joi from "joi";
import "joi-extract-type";

function isValidForSchema(data: unknown, schema: Joi.AnySchema): boolean {
	const { error } = schema.validate(data);
	return !error;
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

const partialDataItem = {
	ciphertext: Joi.string().required(),
	objectType: Joi.string().required(),
};
type PartialDataItem = Joi.extractType<typeof partialDataItem>;

export function isPartialDataItem(tbd: unknown): tbd is PartialDataItem {
	return isValidForSchema(tbd, Joi.object(partialDataItem));
}

const dataItem = Joi.object(partialDataItem);
export type DataItem = Joi.extractType<typeof dataItem>;

const partialKeys = {
	dekMaterial: Joi.string().required(),
	passSalt: Joi.string().required(),
	oldDekMaterial: Joi.string(),
	oldPassSalt: Joi.string(),
};
type PartialKeys = Joi.extractType<typeof partialKeys>;

export function isPartialKeys(tbd: unknown): tbd is PartialKeys {
	return isValidForSchema(tbd, Joi.object(partialKeys));
}

// FIXME: This need not be Joi if we never validate it. Isn't it identical to PartialKeys?
const keys = Joi.object(partialKeys);
export type Keys = Joi.extractType<typeof keys>;

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

export type Identified<T> = T & { _id: string };
export type IdentifiedDataItem = Identified<DataItem> | Identified<Keys> | User;
