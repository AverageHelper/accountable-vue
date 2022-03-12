import type { RequestHandler } from "express";
import { Context } from "./Context.js";
import { UnauthorizedError } from "../errors/index.js";
import safeCompare from "tsscmp";

interface Params {
	uid?: string;
}

/**
 * Returns a handler that makes sure the request's `uid` param
 * matches the calling user's authorization token.
 *
 * Make sure the `requireAuth` handler has been called first, or
 * this handler will always throw an `UnauthorizedError`.
 */
export function ownersOnly(this: void): RequestHandler<Params> {
	return (req, res, next): void => {
		const auth = Context.get(req);
		const uid = req.params.uid ?? "";

		if (!auth || !uid || !safeCompare(uid, auth.uid)) {
			throw new UnauthorizedError();
		}
		next();
	};
}
