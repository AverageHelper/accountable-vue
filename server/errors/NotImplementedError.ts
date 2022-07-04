import { InternalError } from "./InternalError.js";

export class NotImplementedError extends InternalError {
	constructor(nameOfFeature: string = "That feature") {
		super({
			status: 501,
			code: "not-implemented",
			// FIXME: This seems silly
			message: `${nameOfFeature} is not implemented yet`,
		});
		this.name = "NotImplementedError";
	}
}
