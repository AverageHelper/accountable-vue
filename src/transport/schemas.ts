import type { CollectionID } from "./db";
import type { Infer } from "superstruct";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import {
	array,
	boolean,
	define,
	enums,
	is,
	nullable,
	number,
	object,
	optional,
	string,
	union,
} from "superstruct";

export const primitive = nullable(union([string(), number(), boolean()]));
export type Primitive = Infer<typeof primitive>;

export function isPrimitive(tbd: unknown): tbd is Primitive {
	return is(tbd, primitive);
}

export type DocumentData = Record<string, Primitive>;
export type PrimitiveRecord<T> = {
	[K in keyof T]: Primitive;
};

interface DocumentRef {
	collectionId: CollectionID;
	documentId: string;
}

interface SetBatch {
	type: "set";
	ref: DocumentRef;
	data: DocumentData;
}

interface DeleteBatch {
	type: "delete";
	ref: DocumentRef;
}

export type DocumentWriteBatch = SetBatch | DeleteBatch;

export function isRecord(tbd: unknown): tbd is Record<string, unknown> {
	return (
		tbd !== undefined && //
		tbd !== null &&
		isObject(tbd) &&
		!isArray(tbd)
	);
}

export const documentData = define<DocumentData>(
	"documentData",
	value => isRecord(value) && Object.values(value).every(isPrimitive)
);

export function isDocumentData(tbd: unknown): tbd is DocumentData {
	return is(tbd, documentData);
}

const rawServerResponse = object({
	message: optional(string()),
	version: optional(string()),
	access_token: optional(string()),
	uid: optional(string()),
	data: optional(nullable(union([documentData, array(documentData)]))),
	dataType: optional(enums(["single", "multiple"] as const)),
});

export function isRawServerResponse(tbd: unknown): tbd is RawServerResponse {
	return is(tbd, rawServerResponse);
}

export type RawServerResponse = Infer<typeof rawServerResponse>;

const fileData = object({
	contents: string(),
	_id: string(),
});
export type FileData = Infer<typeof fileData>;

export function isFileData(tbd: unknown): tbd is FileData {
	return is(tbd, fileData);
}
