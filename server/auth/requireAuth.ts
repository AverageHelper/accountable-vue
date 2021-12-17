import type { Request, RequestHandler } from "express";
import type { User } from "../database/schemas.js";
import { asyncWrapper } from "../asyncWrapper.js";
import { blacklistHasJwt, jwtTokenFromRequest, verifyJwt } from "./jwt.js";
import { CollectionReference, DocumentReference } from "../database/references.js";
import { Context } from "./Context.js";
import { fetchDbDoc } from "../database/mongo.js";
import { UnauthorizedError } from "../responses.js";

async function userWithUid(uid: string): Promise<User | null> {
	// Find first user whose UID matches
	const collection = new CollectionReference<User>("users");
	const ref = new DocumentReference(collection, uid);
	return await fetchDbDoc(ref);
}

export async function userFromRequest(req: Request): Promise<User | null> {
	const token = jwtTokenFromRequest(req);
	if (token === null) return null;
	if (blacklistHasJwt(token)) return null;

	const payload = await verifyJwt(token).catch(() => {
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
