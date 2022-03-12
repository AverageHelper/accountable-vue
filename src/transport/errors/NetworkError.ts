import type { ServerResponse } from "../networking.js";

export class NetworkError extends Error {
	readonly code: number;

	constructor(response: ServerResponse) {
		super(response.message);
		this.name = "NetworkError";
		this.code = response.status;
	}
}
