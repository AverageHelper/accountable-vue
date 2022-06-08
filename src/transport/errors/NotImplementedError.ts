import { NetworkError } from "./NetworkError.js";
import { describeCode, HttpStatusCode } from "../../helpers/HttpStatusCode.js";

export class NotImplementedError extends NetworkError {
	constructor() {
		super({
			code: "not-implemented",
			status: HttpStatusCode.NOT_IMPLEMENTED,
			message: describeCode(HttpStatusCode.NOT_IMPLEMENTED),
		});
		this.name = "NotImplementedError";
	}
}
