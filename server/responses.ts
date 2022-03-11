import type { DocumentData } from "./database/index.js";
import type { Response } from "express";
import { InternalError } from "./errors/index.js";

// See https://stackoverflow.com/a/54337073 for why "Vary: *" is necessary for Safari
const VARY = ["Vary", "*"] as const;
const CACHE_CONTROL = ["Cache-Control", "no-store"] as const;

export function respondSuccess(
	this: void,
	res: Response,
	additionalValues?: Record<string, string | number>
): void {
	res
		.setHeader(...CACHE_CONTROL) //
		.setHeader(...VARY)
		.json({ ...additionalValues, message: "Success!" });
}

export function respondData<T extends { _id: string } | { uid: string }>(
	this: void,
	res: Response,
	data: DocumentData<T> | Array<DocumentData<T>> | null
): void {
	res
		.setHeader(...CACHE_CONTROL)
		.setHeader(...VARY)
		.json({ message: "Success!", data });
}

export function respondError(this: void, res: Response, err: InternalError): void {
	res.setHeader(...CACHE_CONTROL);
	res.setHeader(...VARY);
	err.headers.forEach((value, name) => {
		res.setHeader(name, value);
	});
	res.status(err.status).json({ message: err.message });
}

export function respondInternalError(this: void, res: Response): void {
	respondError(res, new InternalError());
}
