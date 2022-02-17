import type { RequestHandler } from "express";

const _allowedOrigins: NonEmptyArray<string> = ["http://localhost:3000"];
const host = process.env["HOST"]; // TODO: Document this
if (host !== undefined) {
	_allowedOrigins.push(host);
}

export const allowedOrigins: Readonly<NonEmptyArray<string>> = _allowedOrigins;
console.log("allowedOrigins:", Array.from(allowedOrigins.values()));

export const options: RequestHandler = (req, res, next) => {
	if (req.method === "OPTIONS") {
		console.log("Got OPTIONS check");

		const origin = req.headers.origin ?? allowedOrigins[0];
		if (!allowedOrigins.includes(origin)) {
			const message =
				"The CORS policy for this site does not allow access from the specified Origin.";
			res.status(502).send(message).end();
		}

		res.setHeader("Allow", "OPTIONS, GET, HEAD, POST, DELETE");
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.status(204).end();
		return;
	}
	next();
};
