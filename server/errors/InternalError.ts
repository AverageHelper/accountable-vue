export class InternalError extends Error {
	/** The HTTP status that should be reported to the caller. */
	public readonly status: number;

	/** `false` if we should log the error internally. */
	public readonly harmless: boolean;

	/** Headers that should be sent along with the error. */
	public readonly headers: ReadonlyMap<string, string | number | ReadonlyArray<string>>;

	constructor({
		message = "Not sure what went wrong. Try again maybe?",
		status = 500,
		headers = new Map(),
		harmless = false,
	}: {
		message?: string;
		status?: number;
		headers?: Map<string, string | number | ReadonlyArray<string>>;
		harmless?: boolean;
	} = {}) {
		super(message);
		this.status = status;
		this.headers = headers;
		this.harmless = harmless;
		this.name = "InternalError";
	}

	toString(): string {
		const headers: Record<string, string> = {};
		this.headers.forEach((value, key) => {
			headers[key] = value.toString();
		});
		return JSON.stringify({
			name: this.name,
			message: this.message,
			status: this.status,
			harmless: this.harmless,
			headers,
		});
	}
}
