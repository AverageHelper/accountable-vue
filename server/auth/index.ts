import type { User } from "../database/schemas.js";
import { addJwtToBlacklist, jwtTokenFromRequest, newAccessToken } from "./jwt.js";
import { asyncWrapper } from "../asyncWrapper.js";
import { BadRequestError, DuplicateAccountError, UnauthorizedError } from "../responses.js";
import { CollectionReference, DocumentReference } from "../database/references.js";
import { Context } from "./Context.js";
import { findDbDoc, upsertDbDoc } from "../database/mongo.js";
import { Router } from "express";
import { throttle } from "./throttle.js";
import { userFromRequest } from "./requireAuth.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";

interface ReqBody {
	account?: unknown;
	newaccount?: unknown;
	password?: unknown;
	newpassword?: unknown;
}

async function generateSalt(): Promise<string> {
	return await bcrypt.genSalt(15);
}

async function generateHash(input: string, salt: string): Promise<string> {
	return await bcrypt.hash(input, salt);
}

async function userWithAccountId(accountId: string): Promise<User | null> {
	// Find first user whose account ID matches
	const ref = new CollectionReference<User>("users");
	return await findDbDoc(ref, { currentAccountId: accountId });
}

async function upsertUser(user: User): Promise<void> {
	const collection = new CollectionReference<User>("users");
	const ref = new DocumentReference(collection, user.uid);
	await upsertDbDoc(ref, user);
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
			throttle(),
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
				await upsertUser(user);

				// ** Generate an auth token and send it along
				const access_token = await newAccessToken(user);
				res.json({ access_token, uid });
			})
		)
		.post<unknown, unknown, ReqBody>(
			"/login",
			throttle(),
			asyncWrapper(async (req, res) => {
				// ** Create a JWT for the caller to use later

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
				const uid = storedUser.uid;
				res.json({ access_token, uid });
			})
		)
		.post(
			"/logout",
			throttle(),
			asyncWrapper(async (req, res) => {
				const token = jwtTokenFromRequest(req);
				const user = await userFromRequest(req);
				if (!user || token === null) {
					res.json({ message: "Success!" });
					return;
				}

				// ** Blacklist the JWT
				addJwtToBlacklist(token);
				res.json({ message: "Success!" });
			})
		)
		.post<unknown, unknown, ReqBody>(
			"updatepassword",
			throttle(),
			asyncWrapper(async (req, res) => {
				// Ask for full credentials, so we aren't leaning on a repeatable token
				const givenAccountId = req.body.account;
				const givenPassword = req.body.password;
				const newGivenPassword = req.body.newpassword;
				if (
					typeof givenAccountId !== "string" ||
					typeof givenPassword !== "string" ||
					typeof newGivenPassword !== "string" ||
					givenAccountId === "" ||
					givenPassword === "" ||
					newGivenPassword === ""
				) {
					throw new BadRequestError("Improper parameter types");
				}

				// ** Get credentials
				const storedUser = await userWithAccountId(givenAccountId);
				if (!storedUser) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Verify old credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Store new credentials
				const passwordSalt = await generateSalt();
				const passwordHash = await generateHash(newGivenPassword, passwordSalt);
				await upsertUser({
					...storedUser,
					passwordHash,
					passwordSalt,
				});

				// TODO: Invalidate the old jwt, send a new one
				res.json({ message: "Success!" });
			})
		)
		.post<unknown, unknown, ReqBody>(
			"updateaccountid",
			throttle(),
			asyncWrapper(async (req, res) => {
				// Ask for full credentials, so we aren't leaning on a repeatable token
				const givenAccountId = req.body.account;
				const newGivenAccountId = req.body.newaccount;
				const givenPassword = req.body.password;
				if (
					typeof givenAccountId !== "string" ||
					typeof newGivenAccountId !== "string" ||
					typeof givenPassword !== "string" ||
					givenAccountId === "" ||
					newGivenAccountId === "" ||
					givenPassword === ""
				) {
					throw new BadRequestError("Improper parameter types");
				}

				// ** Get credentials
				const storedUser = await userWithAccountId(givenAccountId);
				if (!storedUser) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Verify old credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Store new credentials
				await upsertUser({
					...storedUser,
					currentAccountId: newGivenAccountId,
				});

				// TODO: Invalidate the old jwt, send a new one
				res.json({ message: "Success!" });
			})
		);
}

export { Context };
export * from "./ownersOnly.js";
export * from "./requireAuth.js";
