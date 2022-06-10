export class UnreachableError extends Error {
	constructor(value: never) {
		super(`Unreachable case: ${JSON.stringify(value)}`); // TODO: I18N
		this.name = "UnreachableError";
	}
}
