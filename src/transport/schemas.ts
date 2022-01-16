import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import Joi from "joi";
import "joi-extract-type";

export const primitive = Joi.alt(Joi.string(), Joi.number(), Joi.boolean()).allow(null);

export const documentData = Joi.object().pattern(Joi.string(), primitive);

export type Primitive = Joi.extractType<typeof primitive>;
export type DocumentData = Joi.extractType<typeof documentData>; // Record<string, Primitive>;
export type PrimitiveRecord<T> = {
	[K in keyof T]: Primitive;
};

const rawServerResponse = Joi.object({
	message: Joi.string().allow(""),
	access_token: Joi.string(),
	uid: Joi.string(),
	data: Joi.alt(documentData, Joi.array().items(documentData)).allow(null),
	dataType: Joi.string().valid("single", "multiple"),
});

export function isRawServerResponse(tbd: unknown): tbd is RawServerResponse {
	return rawServerResponse.validate(tbd).error === undefined;
}

export type RawServerResponse = Joi.extractType<typeof rawServerResponse>;

export function isRecord(tbd: unknown): tbd is Record<string, unknown> {
	return (
		tbd !== undefined && //
		tbd !== null &&
		isObject(tbd) &&
		!isArray(tbd)
	);
}

export function isPrimitive(tbd: unknown): tbd is Primitive {
	return primitive.validate(tbd).error === undefined;
}

export function isDocumentData(tbd: unknown): tbd is DocumentData {
	return documentData.validate(tbd).error === undefined;
}
