import type { DocumentData } from "./db.js";
import { describeCode, HttpStatusCode } from "../helpers/HttpStatusCode.js";
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
	status: HttpStatusCode;
	message: string;
}

export class UnexpectedResponseError extends TypeError {
	constructor() {
		super("Server response was unexpected");
		this.name = "UnexpectedResponseError";
	}
}

export class NetworkError extends Error {
	readonly code: number;

	constructor(response: ServerResponse) {
		super(response.message);
		this.name = "NetworkError";
		this.code = response.status;
	}
}

export class NotImplementedError extends NetworkError {
	constructor() {
		super({
			status: HttpStatusCode.NOT_IMPLEMENTED,
			message: describeCode(HttpStatusCode.NOT_IMPLEMENTED),
		});
		this.name = "NotImplementedError";
	}
}

const OK = HttpStatusCode.OK;

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
	let result: ServerResponse;
	console.log("Request:", request);
	try {
		const response = await fetch(url.href, request);
		console.log("Response:", response);

		const json: unknown = await response.json();
		if (!isRawServerResponse(json)) throw new UnexpectedResponseError();

		result = {
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

	// Throw if the server says something messed up
	if (result.status !== OK) {
		throw new NetworkError(result);
	}
	return result;
}

/** Performs a GET request at the provided URL, optionally using the given JWT. */
export async function getFrom(url: URL, jwt?: string): Promise<ServerResponse> {
	const response = await doRequest(url, { method: "GET" }, jwt);
	if (response.status !== OK) {
		throw new NetworkError(response);
	}
	return response;
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
	throw new NotImplementedError();
}

/** Performs a multipart POST request at the provided URL using the given body and JWT. */
export async function uploadTo(url: URL, fileBody: string, jwt: string): Promise<ServerResponse> {
	const urlString = url.toString();
	const fileName = urlString.slice(Math.max(0, urlString.lastIndexOf("/") + 1));
	if (!fileName) throw new TypeError(`Couldn't get file name from '${urlString}'`);

	const body = new File([fileBody], "file.json", { type: "application/json" });
	return await doRequest(url, { method: "POST", body }, jwt);
}
