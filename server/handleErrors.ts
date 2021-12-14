import type { ErrorRequestHandler } from "express";
import { respondInternalError } from "./responses.js";

export const handleErrors: ErrorRequestHandler = (err, req, res) => {
	console.error(err);
	respondInternalError(res);
};
