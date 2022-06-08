import type { ServerResponse } from "../api-types/index.js";

type ErrorCode =
	| "account-conflict"
	| "bad-gateway"
	| "bad-method"
	| "expired-token"
	| "missing-token"
	| "not-found"
	| "not-implemented"
	| "not-owner"
	| "too-many-requests"
	| "wrong-credentials"
	| "unknown";

function messageFromCode(code: string | undefined): string | null {
	// TODO: I18N
	switch (code as ErrorCode) {
		case "account-conflict":
			return "An account with that ID already exists";
		case "bad-gateway":
			return "The CORS policy for this site does not allow access from the specified Origin.";
		case "bad-method":
			return "That method is not allowed here. What are you trying to do?";
		case "expired-token":
			return "You must sign in again in order to proceed";
		case "missing-token":
			return "Unauthorized";
		case "not-found":
			return "No data found";
		case "not-implemented":
			return "That feature is not implemented yet";
		case "not-owner":
			return "Unauthorized";
		case "too-many-requests":
			return "You are being throttled";
		case "wrong-credentials":
			return "Incorrect account ID or passphrase";
		case "unknown":
			return "Not sure what went wrong. Try again maybe?";
		default:
			return null;
	}
}

export class NetworkError extends Error {
	readonly status: Readonly<number>;
	readonly code: Readonly<string>;

	constructor(response: ServerResponse) {
		super(messageFromCode(response.code) ?? response.message);
		this.name = "NetworkError";
		this.status = response.status;
		this.code = response.code ?? "unknown";
	}
}
