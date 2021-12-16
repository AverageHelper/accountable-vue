import type { User } from "../database/schemas.js";
import { asyncWrapper } from "../asyncWrapper.js";
import { BadRequestError, DuplicateAccountError, UnauthorizedError } from "../responses.js";
import { CollectionReference, DocumentReference } from "../database/references.js";
import { Context } from "./Context.js";
import { findDbDoc, upsertDbDoc } from "../database/mongo.js";
import { addJwtToBlacklist, jwtTokenFromRequest, newAccessToken } from "./jwt.js";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";

interface ReqBody {
	account?: unknown;
	password?: unknown;
}

async function userWithAccountId(accountId: string): Promise<User | null> {
	const ref = new CollectionReference<User>("users");
	// FIXME: This is slow
	// Find first user whose account ID matches
	return await findDbDoc(ref, { currentAccountId: accountId });
}

async function generateSalt(): Promise<string> {
	return await bcrypt.genSalt(15);
}

async function generateHash(input: string, salt: string): Promise<string> {
	return await bcrypt.hash(input, salt);
}

/**
 * Routes and middleware for a basic authentication flow. Installs a
 * `context` property on the request object that includes the caller's
 * authorized user ID.
 *
 * @see https://thecodebarbarian.com/oauth-with-node-js-and-express.html
 */
export function auth(this: void): Router {
	return Router()
		.post<unknown, unknown, ReqBody>(
			"/join",
			asyncWrapper(async (req, res) => {
				const givenAccountId = req.body.account;
				const givenPassword = req.body.password;
				if (typeof givenAccountId !== "string" || typeof givenPassword !== "string") {
					throw new BadRequestError("Improper parameter types");
				}

				// ** Check credentials are unused
				const storedUser = await userWithAccountId(givenAccountId);
				if (storedUser) {
					throw new DuplicateAccountError();
				}

				// ** Store credentials
				const passwordSalt = await generateSalt();
				const passwordHash = await generateHash(givenPassword, passwordSalt);
				const uid = uuid().replace(/-/gu, ""); // remove hyphens
				const user: User = {
					uid,
					_id: uid,
					currentAccountId: givenAccountId,
					passwordHash,
					passwordSalt,
				};

				const collection = new CollectionReference<User>("users");
				const ref = new DocumentReference(collection, uid);
				await upsertDbDoc(ref, user);

				// ** Generate an auth token and send it along
				const access_token = await newAccessToken(user);
				res.json({ access_token });
			})
		)
		.post<unknown, unknown, ReqBody>(
			"/login",
			asyncWrapper(async (req, res) => {
				// ** Create a JWT for the caller to use later
				// TODO: Prevent brute-forcing against same user ID
				// TODO: Limit num of consecutive failed attempts by the same user name and IP
				// FIXME: We're vulnerable to CSRF attacks here

				const givenAccountId = req.body.account;
				const givenPassword = req.body.password;
				if (
					typeof givenAccountId !== "string" ||
					typeof givenPassword !== "string" ||
					givenAccountId === "" ||
					givenPassword === ""
				) {
					throw new BadRequestError("Improper parameter types");
				}

				// ** Get credentials
				const storedUser = await userWithAccountId(givenAccountId);
				if (!storedUser) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Verify credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Generate an auth token and send it along
				const access_token = await newAccessToken(storedUser);
				res.json({ access_token });
			})
		)
		.post("/logout", (req, res) => {
			const token = jwtTokenFromRequest(req);
			if (token === null) {
				res.json({ message: "Success!" });
				return;
			}

			// ** Blacklist the JWT
			// FIXME: Anybody can just flood us with logouts to blacklist
			addJwtToBlacklist(token);
			res.json({ message: "Success!" });
		});
	// TODO: Endpoint to update user login data. Ask for full credentials, so we aren't leaning on a repeatable token
}

export { Context };
export * from "./ownersOnly.js";
export * from "./requireAuth.js";
