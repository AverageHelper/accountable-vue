import { InternalError } from "./InternalError.js";

export class NotFoundError extends InternalError {
	constructor() {
		super({ status: 404, code: "not-found", message: "No data found", harmless: true });
		this.name = "NotFoundError";
	}
}
