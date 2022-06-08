import { InternalError } from "./InternalError.js";

export class OriginError extends InternalError {
	constructor() {
		super({
			status: 502,
			code: "bad-gateway",
			message: "The CORS policy for this site does not allow access from the specified Origin.",
			harmless: true,
		});
		this.name = "OriginError";
	}
}
