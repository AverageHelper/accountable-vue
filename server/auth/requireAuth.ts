import type { JsonWebTokenError } from "jsonwebtoken";
import type { Request, RequestHandler } from "express";
import type { User } from "../database/schemas.js";
import { asyncWrapper } from "../asyncWrapper.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/index.js";
import { blacklistHasJwt, jwtTokenFromRequest, verifyJwt } from "./jwt.js";
import { Context } from "./Context.js";
import { findUserWithProperties } from "../database/io.js";

interface Metadata {
	user: User;
}

async function userWithUid(uid: string): Promise<User | null> {
	// Find first user whose UID matches
	return await findUserWithProperties({ uid });
}

export async function metadataFromRequest(
	req: Pick<Request, "session" | "headers">
): Promise<Metadata> {
	const token = jwtTokenFromRequest(req);
	if (token === null) {
		console.debug("Request has no JWT");
		throw new UnauthorizedError("missing-token");
	}
	if (blacklistHasJwt(token)) {
		console.debug("Request has a blacklisted JWT");
		throw new UnauthorizedError("expired-token");
	}

	const payload = await verifyJwt(token).catch((error: JsonWebTokenError) => {
		console.debug(`JWT failed to verify because ${error.message}`);
		throw new UnauthorizedError("expired-token");
	});

	const uid = (payload["uid"] as string | undefined) ?? null;
	if (uid === null || typeof uid !== "string")
		throw new BadRequestError("Missing or invalid `uid`");

	// NOTE: We need a full user-fetch here so we know we're working with a real user.
	// You might be tempted to slim this down to just passing the UID through, but don't.
	const user = await userWithUid(uid);
	if (!user) throw new NotFoundError();

	return { user };
}

/** A handler that makes sure the calling user is authorized to access the requested resource. */
export const requireAuth: RequestHandler = asyncWrapper(async (req, res, next) => {
	const metadata = await metadataFromRequest(req);
	const uid = metadata.user.uid;

	Context.bind(req, { uid }); // This reference drops when the request is done
	next();
});
