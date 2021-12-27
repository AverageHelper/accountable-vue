import type { DocumentData } from "./db.js";
import type { ValueIteratorTypeGuard } from "lodash";
import isArray from "lodash/isArray";
import isFunction from "lodash/isFunction";
import isNumber from "lodash/isNumber";
import isString from "lodash/isString";
import { isDocumentData, isRecord } from "./db.js";

interface RawServerResponse {
	message?: string;
	access_token?: string;
	data?: DocumentData | Array<DocumentData> | null;
}

interface ServerResponse extends RawServerResponse {
	status: number;
	message: string;
}

function isArrayWhere<T>(tbd: unknown, guard: ValueIteratorTypeGuard<unknown, T>): tbd is Array<T> {
	return isArray(tbd) && tbd.every(guard);
}

function isRawServerResponse(tbd: unknown): tbd is RawServerResponse {
	if (
		!isRecord(tbd) ||
		isNumber(tbd) ||
		isString(tbd) ||
		isFunction(tbd) ||
		isArray(tbd) ||
		Object.keys(tbd).length > 3 // only enough keys for RawServerResponse
	)
		return false;

	if ("data" in tbd) {
		const data = tbd["data"];
		if (
			!isDocumentData(data) && //
			!isArrayWhere(data, isDocumentData) &&
			data !== null
		)
			return false;
	}

	if ("access_token" in tbd) {
		const token = tbd["access_token"];
		if (!isString(token)) return false;
	}

	if ("message" in tbd) {
		const message = tbd["message"];
		if (!isString(message)) return false;
	}

	return true;
}

async function doRequest(
	url: URL,
	req: Omit<RequestInit, "headers">,
	jwt?: string
): Promise<ServerResponse> {
	const headers: HeadersInit = {};
	if (jwt !== undefined) {
		headers["Authorization"] = jwt;
	}
	const request: RequestInit = { ...req, headers };
	console.log("Request:", request);
	try {
		const response = await fetch(url.toString(), request);
		console.log("Response:", response);

		const json: unknown = await response.json();
		if (!isRawServerResponse(json)) throw new TypeError("Server response was unexpected");

		return {
			status: response.status,
			message: response.statusText,
			...json,
		};
	} catch (error: unknown) {
		// `fetch` only rejects on network failure.
		// See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
		console.error("Network Failure:", error);
		throw error;
	}
}

/** Performs a GET request at the provided URL, optionally using the given JWT. */
export async function getFrom(url: URL, jwt?: string): Promise<ServerResponse> {
	return await doRequest(url, { method: "GET" }, jwt);
}

/** Performs a POST request at the provided URL using the given body and optional JWT. */
export async function postTo(url: URL, body: DocumentData, jwt?: string): Promise<ServerResponse> {
	return await doRequest(url, { method: "POST", body: JSON.stringify(body) }, jwt);
}

/** Performs a DELETE request at the provided URL using the given JWT. */
export async function deleteAt(url: URL, jwt: string): Promise<ServerResponse> {
	return await doRequest(url, { method: "DELETE" }, jwt);
}
