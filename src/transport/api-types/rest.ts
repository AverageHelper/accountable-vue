import type { DocumentData, DocumentWriteBatch, RawServerResponse } from "../schemas.js";
import { describeCode, HttpStatusCode } from "../../helpers/HttpStatusCode.js";
import { isFileData, isRawServerResponse } from "../schemas.js";
import { NetworkError, UnexpectedResponseError } from "../errors/index.js";

export interface ServerResponse extends RawServerResponse {
	status: HttpStatusCode;
	message: string;
}

/** Performs a GET request at the provided URL, optionally using the given JWT. */
export async function getFrom(url: URL, token?: string): Promise<ServerResponse> {
	return await doRequest(url, { method: "GET" }, token);
}

/** Performs a POST request at the provided URL using the given body and optional JWT. */
export async function postTo(
	url: URL,
	body: DocumentData | Array<DocumentWriteBatch>,
	token?: string
): Promise<ServerResponse> {
	return await doRequest(url, { method: "POST", body: JSON.stringify(body) }, token);
}

/** Performs a DELETE request at the provided URL using the given JWT. */
export async function deleteAt(url: URL, token?: string): Promise<ServerResponse> {
	return await doRequest(url, { method: "DELETE" }, token);
}

/** Performs a multipart GET request at the provided URL using the given JWT. */
export async function downloadFrom(url: URL, token: string): Promise<string> {
	const response = await getFrom(url, token);
	const data = response.data as unknown;
	if (!isFileData(data)) throw new UnexpectedResponseError("Invalid file data");
	return data.contents;
}

/** Performs a multipart POST request at the provided URL using the given body and JWT. */
export async function uploadTo(url: URL, fileBody: string, token: string): Promise<ServerResponse> {
	const urlString = url.toString();
	const fileName = urlString.slice(Math.max(0, urlString.lastIndexOf("/") + 1));
	if (!fileName) throw new TypeError(`Couldn't get file name from '${urlString}'`);

	const file = new File([fileBody], "file.json", { type: "application/json" });
	const body = new FormData();
	body.append("name", file.name);
	body.append("size", `${file.size}`);
	body.append("type", file.type);
	body.append("file", file);

	// Don't set "Content-Type"
	// See https://muffinman.io/blog/uploading-files-using-fetch-multipart-form-data/
	const headers: Record<string, string | null> = {
		"Content-Type": null,
	};
	return await doRequest(url, { method: "POST", headers, body }, token);
}

const OK = HttpStatusCode.OK;

async function doRequest(
	url: URL,
	req: Omit<RequestInit, "headers"> & { headers?: Record<string, string | null> },
	token?: string
): Promise<ServerResponse> {
	const headers: HeadersInit = {
		"Content-Type": "application/json",
		...req.headers,
	};
	Object.entries(headers).forEach(([key, value]) => {
		if (value === null) {
			delete headers[key];
		}
	});
	if (token !== undefined) {
		headers["Authorization"] = `BEARER ${token}`;
	}
	const request: RequestInit = { ...req, headers };
	let result: ServerResponse;
	try {
		const response = await fetch(url.href, request);

		const json: unknown = await response.json();
		if (!isRawServerResponse(json))
			throw new UnexpectedResponseError(
				`Invalid server response: ${JSON.stringify(json, undefined, "  ")}`
			);

		result = {
			// `fetch` does not always return statusText, per spec: https://fetch.spec.whatwg.org/#concept-response-status-message
			message: response.statusText || describeCode(response.status),
			status: response.status,
			...json,
		};
	} catch (error) {
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
