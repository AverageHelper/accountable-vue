import type { ErrorRequestHandler } from "express";
import { respondInternalError } from "./responses.js";

export const handleErrors: ErrorRequestHandler = (err: unknown, req, res, next) => {
	console.error(err);
	if (res.headersSent) {
		return next(err);
	}
	respondInternalError(res);
};
