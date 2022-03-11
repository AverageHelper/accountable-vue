import { InternalError } from "./InternalError.js";

export class DuplicateAccountError extends InternalError {
	constructor() {
		super({
			status: 409,
			message: "An account with that ID already exists",
			harmless: true,
		});
		this.name = "DuplicateAccountError";
	}
}
