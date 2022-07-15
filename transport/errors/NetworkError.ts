import type { ServerResponse } from "../api-types/index.js";
import { t } from "@/locales/client";

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
	// TODO: Maybe move this call closer to the UI
	return t(`error.network.${code as ErrorCode}`);
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
