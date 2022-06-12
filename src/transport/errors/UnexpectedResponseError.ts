export class UnexpectedResponseError extends TypeError {
	constructor(message: string) {
		super(`Server response was unexpected: ${message}`); // TODO: I18N
		this.name = "UnexpectedResponseError";
	}
}
