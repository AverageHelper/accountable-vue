import { InternalError } from "./InternalError.js";

export class BadMethodError extends InternalError {
	constructor() {
		super({
			status: 405,
			code: "bad-method",
			message: "That method is not allowed here. What are you trying to do?",
			harmless: true,
		});
		this.name = "BadMethodError";
	}
}
