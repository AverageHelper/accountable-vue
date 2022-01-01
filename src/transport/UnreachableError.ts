export class UnreachableError extends Error {
	constructor(value: never) {
		super(`Unreachable case: ${JSON.stringify(value)}`);
		this.name = "UnreachableError";
	}
}
