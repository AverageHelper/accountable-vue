import type { User } from "../database/schemas.js";
import { addJwtToBlacklist, jwtTokenFromRequest, newAccessToken } from "./jwt.js";
import { asyncWrapper } from "../asyncWrapper.js";
import { Context } from "./Context.js";
import { MAX_USERS } from "./limits.js";
import { respondSuccess } from "../responses.js";
import { Router } from "express";
import { throttle } from "./throttle.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import {
	BadRequestError,
	DuplicateAccountError,
	NotEnoughRoomError,
	UnauthorizedError,
} from "../errors/index.js";
import {
	destroyUser,
	findUserWithProperties,
	numberOfUsers,
	statsForUser,
	upsertUser,
} from "../database/io.js";

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
	return await findUserWithProperties({ currentAccountId: accountId });
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

				// ** Make sure we arent' full
				const limit = MAX_USERS;
				const current = await numberOfUsers();
				if (current >= limit)
					throw new NotEnoughRoomError("We're full at the moment. Try again later!");

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
					currentAccountId: givenAccountId,
					passwordHash,
					passwordSalt,
				};
				await upsertUser(user);

				// ** Generate an auth token and send it along
				const access_token = await newAccessToken(user);
				const { totalSpace, usedSpace } = await statsForUser(user.uid);
				respondSuccess(res, { access_token, uid, totalSpace, usedSpace });
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
					console.debug(`Found no user under account ${JSON.stringify(givenAccountId)}`);
					throw new UnauthorizedError("Incorrect account ID or passphrase");
				}

				// ** Verify credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					console.debug(`The given password doesn't match what's stored`);
					throw new UnauthorizedError("Incorrect account ID or passphrase");
				}

				// ** Generate an auth token and send it along
				const access_token = await newAccessToken(storedUser);
				const uid = storedUser.uid;
				const { totalSpace, usedSpace } = await statsForUser(uid);
				respondSuccess(res, { access_token, uid, totalSpace, usedSpace });
			})
		)
		.post("/logout", throttle(), (req, res) => {
			const token = jwtTokenFromRequest(req);
			if (token === null) {
				return respondSuccess(res);
			}

			// ** Blacklist the JWT
			addJwtToBlacklist(token);
			respondSuccess(res);
		})
		.post<unknown, unknown, ReqBody>(
			"/leave",
			throttle(),
			asyncWrapper(async (req, res) => {
				// Ask for full credentials, so we aren't leaning on a repeatable token
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
					throw new UnauthorizedError("Incorrect account ID or passphrase");
				}

				// ** Verify credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					throw new UnauthorizedError("Incorrect account ID or password");
				}

				// ** Delete the user
				await destroyUser(storedUser.uid);

				respondSuccess(res);
			})
		)
		.post<unknown, unknown, ReqBody>(
			"/updatepassword",
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
					throw new UnauthorizedError("Incorrect account ID or passphrase");
				}

				// ** Verify old credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					throw new UnauthorizedError("Incorrect account ID or passphrase");
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
				respondSuccess(res);
			})
		)
		.post<unknown, unknown, ReqBody>(
			"/updateaccountid",
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
					throw new UnauthorizedError("Incorrect account ID or passphrase");
				}

				// ** Verify old credentials
				const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
				if (!isPasswordGood) {
					throw new UnauthorizedError("Incorrect account ID or passphrase");
				}

				// ** Store new credentials
				await upsertUser({
					...storedUser,
					currentAccountId: newGivenAccountId,
				});

				// TODO: Invalidate the old jwt, send a new one
				respondSuccess(res);
			})
		);
}

export { Context };
export * from "./ownersOnly.js";
export * from "./requireAuth.js";
export * from "./limits.js";
