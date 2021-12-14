import type { Request, RequestHandler } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { Context } from "./Context.js";
import { Router } from "express";
import { TemporarySet } from "./TemporarySet.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import safeCompare from "tsscmp";

interface ReqBody {
	account?: unknown;
	password?: unknown;
}

interface User {
	uid: string;
	currentAccountId: string;
	passwordHash: string;
	passwordSalt: string;
}

const jwtBlacklist = new TemporarySet<string>();

// FIXME: This is bad. Write to disk instead. MongoDB?
const users = new Set<User>();

function userWithAccountId(accountId: string): User | null {
	// Find first user whose account ID matches
	return [...users].find(u => safeCompare(accountId, u.currentAccountId)) ?? null;
}

function userWithUid(uid: string): User | null {
	// Find first user whose UID matches
	return [...users].find(u => safeCompare(uid, u.uid)) ?? null;
}

async function generateSalt(): Promise<string> {
	return await bcrypt.genSalt(15);
}

async function generateHash(input: string, salt: string): Promise<string> {
	return await bcrypt.hash(input, salt);
}

const secret = "secretSquirrel"; // TODO: Just one, or a different one per user?
async function newAccessToken(user: User): Promise<string> {
	const options: jwt.SignOptions = { expiresIn: "1h" };
	const data = { uid: user.uid, hash: user.passwordHash };

	return new Promise<string>((resolve, reject) => {
		jwt.sign(data, secret, options, (err, token) => {
			if (err) {
				reject(err);
				return;
			}
			if (token !== undefined) {
				resolve(token);
				return;
			}
			const error = new TypeError(
				`Failed to create JWT for user ${user.uid}: Both error and token parameters were empty.`
			);
			reject(error);
		});
	});
}

function jwtTokenFromRequest(req: Request): string | null {
	const authHeader = req.headers.authorization ?? "";
	if (!authHeader) return null;

	return (authHeader.split(" ")[1] ?? "") || null;
}

async function userFromRequest(req: Request): Promise<User | null> {
	const token = jwtTokenFromRequest(req);
	if (token === null) return null;
	if (jwtBlacklist.has(token)) return null;

	const payload = await new Promise<jwt.JwtPayload>((resolve, reject) => {
		jwt.verify(token, secret, (err, payload) => {
			if (err) {
				reject(err);
				return;
			}
			if (payload !== undefined) {
				resolve(payload);
				return;
			}
			const error = new TypeError(
				"Failed to verify JWT: Both error and payload parameters were empty."
			);
			reject(error);
		});
	});

	const uid = (payload["uid"] as string | undefined) ?? null;
	if (uid === null || typeof uid !== "string")
		throw new TypeError(`Malformatted JWT: ${JSON.stringify(payload)}`);

	return userWithUid(uid);
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
					res.status(400).json({ message: "Improper parameter types" });
					return;
				}

				// ** Check credentials are unused
				const storedUser = userWithAccountId(givenAccountId);
				if (storedUser) {
					res.status(409).json({ message: "An account with that ID already exists" });
					return;
				}

				// ** Store credentials
				const passwordSalt = await generateSalt();
				const passwordHash = await generateHash(givenPassword, passwordSalt);
				const user: User = {
					uid: uuid(),
					currentAccountId: givenAccountId,
					passwordHash,
					passwordSalt,
				};
				users.add(user);

				// ** Generate an auth token and send it along
				const access_token = await newAccessToken(user);
				res.json({ access_token });
			})
		)
		.post<unknown, unknown, ReqBody>(
			"/login",
			asyncWrapper(async (req, res) => {
				// ** Create a JWT for the caller to use later
				// TODO: Prevent brute-forcing same user ID
				// TODO: Limit num of consecutive failed attempts by the same user name and IP
				// FIXME: We're vulnerable to CSRF attacks here

				const givenAccountId = req.body.account;
				const givenPassword = req.body.password;
				if (typeof givenAccountId !== "string" || typeof givenPassword !== "string") {
					res.status(400).json({ message: "Improper parameter types" });
					return;
				}

				// ** Get credentials
				const storedUser = userWithAccountId(givenAccountId);
				if (!storedUser) {
					res.status(403).json({ message: "Incorrect account ID or password" });
					return;
				}

				// ** Verify credentials
				try {
					const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
					if (!isPasswordGood) {
						res.status(403).json({ message: "Incorrect account ID or password" });
						return;
					}
				} catch (error: unknown) {
					console.error(error);
					res.status(500).json({ message: "Something went wrong. Try again?" });
					return;
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
			// TODO: Only blacklist for the duration the token has remaining
			const oneHour = 3600000;
			// FIXME: Anybody can just flood us with logouts to blacklist
			jwtBlacklist.add(token, oneHour);
			res.json({ message: "Success!" });
		});
	// TODO: Endpoint to update user login data
}

/** Returns a handler that makes sure the calling user is authorized here. */
export function requireAuth(this: void): RequestHandler {
	return asyncWrapper(async (req, res, next) => {
		const user = await userFromRequest(req);
		if (!user) {
			res.status(403).json({ message: "Unauthorized" });
			return;
		}

		Context.bind(req, user.uid); // This reference drops when the request is done
		next();
	});
}

interface Params {
	uid?: string;
}

/** Returns a handler that makes sure the request's `uid` param matches the calling user's authorization. */
export function ownersOnly(this: void): RequestHandler<Params> {
	return (req, res, next): void => {
		const auth = Context.get(req);
		const uid = req.params.uid ?? "";

		if (!auth || !uid || !safeCompare(uid, auth.uid)) {
			res.status(403).json({ message: "Unauthorized" });
			return;
		}
		next();
	};
}

export { Context };
