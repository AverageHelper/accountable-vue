import { InternalError } from "./InternalError.js";

export class BadRequestError extends InternalError {
	constructor(message: string = "Invalid data") {
		super({ status: 400, message, harmless: true });
		this.name = "BadRequestError";
	}
}
