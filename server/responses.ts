import type { Response } from "express";

export function respondSuccess(this: void, res: Response): void {
	res.json({ message: "Success!" });
}

export function respondData(this: void, res: Response, data: unknown): void {
	res.json(data);
}

export function respondBadRequest(this: void, res: Response): void {
	res.status(400).json({ message: "Invalid data" });
}

export function respondNotSignedIn(this: void, res: Response): void {
	res.status(403).json({ message: "You must sign in first" });
}

export function respondNotFound(this: void, res: Response): void {
	res.status(404).json({ message: "No data found" });
}

export function respondBadMethod(this: void, res: Response): void {
	res.status(405).json({ message: "That method is not allowed here. What are you trying to do?" });
}

export function respondInternalError(this: void, res: Response): void {
	res.status(500).json({ message: "Not sure what went wrong. Try again maybe?" });
}
