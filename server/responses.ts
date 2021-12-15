import type { Response } from "express";

export class InternalError extends Error {
	/** The HTTP status that should be reported to the caller. */
	public readonly status: number;
	/** `false` if we should log the error internally. */
	public readonly harmless: boolean;

	constructor(
		status: number = 500,
		message: string = "Not sure what went wrong. Try again maybe?",
		harmless: boolean = false
	) {
		super(message);
		this.status = status;
		this.harmless = harmless;
		this.name = "InternalError";
	}
}

export function respondSuccess(this: void, res: Response): void {
	res.json({ message: "Success!" });
}

export function respondData(this: void, res: Response, data: unknown): void {
	res.json(data);
}

export class BadRequestError extends InternalError {
	constructor(message: string = "Invalid data") {
		super(400, message, true);
		this.name = "BadRequestError";
	}
}

export class NotSignedInError extends InternalError {
	constructor() {
		super(403, "You must sign in first", true);
		this.name = "NotSignedInError";
	}
}

export class NotFoundError extends InternalError {
	constructor() {
		super(404, "No data found", true);
		this.name = "NotFoundError";
	}
}

export function respondNotFound(this: void, res: Response): void {
	respondError(res, new NotFoundError());
}

export class BadMethodError extends InternalError {
	constructor() {
		super(405, "That method is not allowed here. What are you trying to do?", true);
		this.name = "BadMethodError";
	}
}

export function respondInternalError(this: void, res: Response): void {
	respondError(res, new InternalError());
}

export function respondError(this: void, res: Response, err: InternalError): void {
	res.status(err.status).json({ message: err.message });
}
