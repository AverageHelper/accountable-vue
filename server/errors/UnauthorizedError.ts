import { InternalError } from "./InternalError.js";

export class UnauthorizedError extends InternalError {
	constructor(message: string = "Unauthorized") {
		super({ status: 403, message, harmless: true });
		this.name = "UnauthorizedError";
	}
}
