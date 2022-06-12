import { InternalError } from "./InternalError.js";

export type UnauthorizedErrorCode =
	| "expired-token"
	| "missing-token"
	| "not-owner"
	| "wrong-credentials";
// TODO: "expired-credentials"

function defaultMessageFromCode(code: UnauthorizedErrorCode): string {
	// TODO: Copy this to clients for better I18N
	switch (code) {
		case "expired-token":
			return "You must sign in again in order to proceed";
		case "missing-token":
			return "Unauthorized";
		case "not-owner":
			return "Unauthorized";
		case "wrong-credentials":
			return "Incorrect account ID or passphrase";
	}
}

export class UnauthorizedError extends InternalError {
	constructor(code: UnauthorizedErrorCode) {
		const message = defaultMessageFromCode(code);
		super({ status: 403, code, message, harmless: true });
		this.name = "UnauthorizedError";
	}
}
