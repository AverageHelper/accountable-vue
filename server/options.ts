import type { RequestHandler } from "express";
import { OriginError } from "./responses.js";

const _allowedOrigins: NonEmptyArray<string> = ["http://localhost:3000"];
const host = process.env["HOST"]; // TODO: Document this
if (host !== undefined) {
	_allowedOrigins.push(host);
}

export const allowedOrigins: Readonly<NonEmptyArray<string>> = _allowedOrigins;
console.log("allowedOrigins:", Array.from(allowedOrigins.values()));

export const options: RequestHandler = (req, res, next) => {
	console.log("Got request", req);
	if (req.method === "OPTIONS") {
		console.log("It's an OPTIONS check");

		const origin = req.headers.origin ?? allowedOrigins[0];
		if (!allowedOrigins.includes(origin)) {
			throw new OriginError();
		}

		res.setHeader("Allow", "OPTIONS, GET, HEAD, POST, DELETE");
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.status(204).end();
		return;
	}
	next();
};
