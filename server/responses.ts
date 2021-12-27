import type { DocumentData } from "./database/index.js";
import type { RateLimiterRes } from "rate-limiter-flexible";
import type { Response } from "express";

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

export function respondSuccess(this: void, res: Response): void {
	res.json({ message: "Success!" });
}

export function respondData<T>(
	this: void,
	res: Response,
	data: DocumentData<T> | Array<DocumentData<T>> | null
): void {
	res.json({ message: "Success!", data });
}

export class BadRequestError extends InternalError {
	constructor(message: string = "Invalid data") {
		super({ status: 400, message, harmless: true });
		this.name = "BadRequestError";
	}
}

export class UnauthorizedError extends InternalError {
	constructor(message: string = "Unauthorized") {
		super({ status: 403, message, harmless: true });
		this.name = "UnauthorizedError";
	}
}

export class NotFoundError extends InternalError {
	constructor() {
		super({ status: 404, message: "No data found", harmless: true });
		this.name = "NotFoundError";
	}
}

export class BadMethodError extends InternalError {
	constructor() {
		super({
			status: 405,
			message: "That method is not allowed here. What are you trying to do?",
			harmless: true,
		});
		this.name = "BadMethodError";
	}
}

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

export class ThrottledError extends InternalError {
	constructor(rateLimiterRes: RateLimiterRes) {
		super({
			status: 429,
			message: "You are being throttled",
			headers: new Map<string, string | number | ReadonlyArray<string>>([
				["Retry-After", rateLimiterRes.msBeforeNext / 1000],
			]),
		});
		this.name = "ThrottledError";
	}
}

export function respondInternalError(this: void, res: Response): void {
	respondError(res, new InternalError());
}

export function respondError(this: void, res: Response, err: InternalError): void {
	err.headers.forEach((value, name) => {
		res.setHeader(name, value);
	});
	res.status(err.status).json({ message: err.message });
}
