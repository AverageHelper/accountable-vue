import type { DataSource, User } from "../database/schemas.js";
import type { JsonWebTokenError } from "jsonwebtoken";
import type { Request, RequestHandler } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { blacklistHasJwt, jwtTokenFromRequest, verifyJwt } from "./jwt.js";
import { Context } from "./Context.js";
import { findUserWithProperties } from "../database/io.js";
import { isDataSourceId } from "../database/schemas.js";
import { UnauthorizedError } from "../errors/index.js";

interface Metadata {
	user: User;
	source: DataSource;
}

async function userWithUid(source: DataSource, uid: string): Promise<User | null> {
	// Find first user whose UID matches
	return await findUserWithProperties(source, { uid });
}

async function metadataFromRequest(req: Request): Promise<Metadata | null> {
	const token = jwtTokenFromRequest(req);
	if (token === null) {
		console.debug("Request has no JWT");
		return null;
	}
	if (blacklistHasJwt(token)) {
		console.debug("Request has a blacklisted JWT");
		return null;
	}

	const payload = await verifyJwt(token).catch((error: JsonWebTokenError) => {
		console.debug(`JWT failed to verify because ${error.message}`);
		throw new UnauthorizedError();
	});

	const uid = (payload["uid"] as string | undefined) ?? null;
	const source = (payload["source"] as string | undefined) ?? null;
	if (uid === null || typeof uid !== "string" || !isDataSourceId(source))
		throw new TypeError(`Malformatted JWT: ${JSON.stringify(payload)}`);

	// NOTE: We need a full user-fetch here so we know we're working with a real user.
	// You might be tempted to slim this down to just passing the UID through, but don't.
	const user = await userWithUid(source, uid);
	if (!user) return null;

	return { user, source };
}

/** Returns a handler that makes sure the calling user is authorized here. */
export function requireAuth(this: void): RequestHandler {
	return asyncWrapper(async (req, res, next) => {
		const metadata = await metadataFromRequest(req);
		if (!metadata) throw new UnauthorizedError();

		const uid = metadata.user.uid;
		const source = metadata.source;
		Context.bind(req, { uid, source }); // This reference drops when the request is done
		next();
	});
}
