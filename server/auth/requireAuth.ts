import type { Request, RequestHandler } from "express";
import type { User } from "../database/schemas.js";
import { asyncWrapper } from "../asyncWrapper.js";
import { blacklistHasJwt, jwtTokenFromRequest, verifyJwt } from "./jwt.js";
import { Context } from "./Context.js";
import { findUserWithProperties } from "../database/io.js";
import { UnauthorizedError } from "../responses.js";

async function userWithUid(uid: string): Promise<User | null> {
	// Find first user whose UID matches
	return await findUserWithProperties({ uid });
}

export async function userFromRequest(req: Request): Promise<User | null> {
	const token = jwtTokenFromRequest(req);
	if (token === null) {
		console.debug("Request has no JWT");
		return null;
	}
	if (blacklistHasJwt(token)) {
		console.debug("Request has a blacklisted JWT");
		return null;
	}

	const payload = await verifyJwt(token).catch(() => {
		console.debug("JWT failed to verify");
		throw new UnauthorizedError();
	});

	const uid = (payload["uid"] as string | undefined) ?? null;
	if (uid === null || typeof uid !== "string")
		throw new TypeError(`Malformatted JWT: ${JSON.stringify(payload)}`);

	return userWithUid(uid);
}

/** Returns a handler that makes sure the calling user is authorized here. */
export function requireAuth(this: void): RequestHandler {
	return asyncWrapper(async (req, res, next) => {
		const user = await userFromRequest(req);
		if (!user) throw new UnauthorizedError();

		Context.bind(req, user.uid); // This reference drops when the request is done
		next();
	});
}
