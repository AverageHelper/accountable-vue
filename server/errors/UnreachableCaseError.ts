export class UnreachableCaseError extends Error {
	constructor(value: never) {
		super(`Unreachable case: ${JSON.stringify(value)}`);
		this.name = "UnreachableCaseError";
	}
}
