export class UnexpectedResponseError extends TypeError {
	constructor(message: string) {
		super(`Server response was unexpected: ${message}`);
		this.name = "UnexpectedResponseError";
	}
}
