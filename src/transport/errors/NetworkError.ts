import type { ServerResponse } from "../api-types/index.js";
import { t } from "../../i18n";

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
	if (code === undefined) return null;
	return t(`common.error.${code as ErrorCode}`);
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
