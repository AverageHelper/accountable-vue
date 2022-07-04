import { UnreachableError } from "./UnreachableError.js";

export type AccountableErrorCode =
	| "auth/account-already-exists"
	| "auth/internal-error"
	| "auth/invalid-argument"
	| "auth/invalid-credential"
	| "auth/quota-exceeded"
	| "auth/unauthenticated"
	| "database/deadline-exceeded"
	| "database/failed-precondition"
	| "database/internal-error"
	| "database/invalid-argument"
	| "database/unauthenticated"
	| "storage/internal-error"
	| "storage/invalid-argument"
	| "storage/invalid-checksum"
	| "storage/quota-exceeded"
	| "storage/retry-limit-exceeded"
	| "storage/server-file-wrong-size"
	| "storage/unauthenticated";

function messageFromCode(code: AccountableErrorCode): string {
	// TODO: I18N
	switch (code) {
		case "auth/account-already-exists":
			return "That account already exists";
		case "auth/internal-error":
			return "Internal auth error";
		case "auth/invalid-argument":
			return "Invalid auth argument";
		case "auth/invalid-credential":
			return "Invalid account ID or password";
		case "auth/quota-exceeded":
		case "database/deadline-exceeded":
			return "You are being throttled";
		case "database/failed-precondition":
			return "Failed precondition";
		case "database/internal-error":
			return "Internal database error";
		case "database/invalid-argument":
			return "Invalid database argument";
		case "storage/internal-error":
			return "Internal storage error";
		case "storage/invalid-argument":
			return "Invalid storage argument";
		case "storage/invalid-checksum":
			return "The uploaded file does not match the provided checksum. Please reupload";
		case "storage/quota-exceeded":
		case "storage/retry-limit-exceeded":
			return "You are being throttled";
		case "storage/server-file-wrong-size":
			return "The uploaded file does not match the provided file size. Please reupload";
		case "auth/unauthenticated":
		case "database/unauthenticated":
		case "storage/unauthenticated":
			return "You must sign in first";
		default:
			throw new UnreachableError(code);
	}
}

export class AccountableError extends Error {
	readonly code: AccountableErrorCode;
	customData?: Record<string, unknown> | undefined;
	readonly name = "AccountableError";

	constructor(code: AccountableErrorCode, customData?: Record<string, unknown> | undefined) {
		super(messageFromCode(code));
		this.code = code;
		this.customData = customData;
	}

	toString(): string {
		return JSON.stringify({
			name: this.name,
			code: this.code,
			message: this.message,
		});
	}
}
