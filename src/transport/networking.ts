import type { DocumentData } from "./db.js";
import { describeCode } from "../helpers/HttpStatusCode.js";
import { documentData } from "./db.js";
import Joi from "joi";
import "joi-extract-type";

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

interface ServerResponse extends RawServerResponse {
	status: number;
	message: string;
}

export class UnexpectedResponseError extends TypeError {
	constructor() {
		super("Server response was unexpected");
		this.name = "UnexpectedResponseError";
	}
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
		const response = await fetch(url.href, request);
		console.log("Response:", response);

		const json: unknown = await response.json();
		if (!isRawServerResponse(json)) throw new UnexpectedResponseError();

		return {
			// `fetch` does not always return statusText, per spec: https://fetch.spec.whatwg.org/#concept-response-status-message
			message: response.statusText || describeCode(response.status),
			status: response.status,
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

/** Performs a multipart GET request at the provided URL using the given JWT. */
export async function downloadFrom(url: URL, jwt: string): Promise<string> {
	// TODO: Do the download
	return "{}";
}

/** Performs a multipart POST request at the provided URL using the given body and JWT. */
export async function uploadTo(url: URL, body: string, jwt: string): Promise<ServerResponse> {
	// TODO: Do the upload
	return {
		status: 501,
		message: "Not implemented",
	};
}
