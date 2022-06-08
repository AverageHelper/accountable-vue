import type { ServerResponse } from "../api-types/index.js";

const errorCodes = [
	"expired-token",
	"missing-token",
	"not-owner",
	"wrong-credentials",
	"unknown",
] as const;

type ErrorCode = typeof errorCodes[number];

function isErrorCode(tbd: string): tbd is ErrorCode {
	return errorCodes.includes(tbd as ErrorCode);
}

function errorCodeFromString(str: string): ErrorCode {
	if (isErrorCode(str)) return str;
	return "unknown";
}

function messageFromCode(code: ErrorCode): string {
	// TODO: I18N
	switch (code) {
		case "expired-token":
			return "You must sign in again in order to proceed";
		case "missing-token":
			return "Unauthorized";
		case "not-owner":
			return "Unauthorized";
		case "wrong-credentials":
			return "Incorrect account ID or passphrase";
		case "unknown":
		default:
			return "Not sure what went wrong. Try again maybe?";
	}
}

export class NetworkError extends Error {
	readonly status: Readonly<number>;
	readonly code: Readonly<string>;

	constructor(response: ServerResponse) {
		super(response.message || messageFromCode(errorCodeFromString(response.code ?? "")));
		this.name = "NetworkError";
		this.status = response.status;
		this.code = response.code ?? "unknown";
	}
}
