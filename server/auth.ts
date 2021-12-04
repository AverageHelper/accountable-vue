import type { RequestHandler } from "express";
import type { SessionData } from "express-session";
import { generateSecureToken } from "n-digit-token";
import { Router } from "express";
import bcrypt from "bcrypt";
import safeCompare from "tsscmp";
import sessions, { Store as ExpressSessionStore } from "express-session";
import { v4 as uuid } from "uuid";
import { asyncWrapper } from "./asyncWrapper.js";

interface RequestContext {
	auth: Access | null;
}

declare module "express-session" {
	interface SessionData {
		context: RequestContext;
	}
}

// FIXME: This is bad. Write to disk instead. MongoDB?
const users = new Set<User>();
const accessTokens = new Map<string, Access>();

interface User {
	uid: string;
	currentAccountId: string;
	passwordHash: string;
	passwordSalt: string;
}

interface Access {
	token: string;
	uid: string;
	created_at: Date;
	expires_in_seconds: number;
}

function userWithAccountId(accountId: string): User | null {
	// Find first user whose account ID matches
	return [...users].find(u => safeCompare(accountId, u.currentAccountId)) ?? null;
}

export async function sha512(input: string, salt: string): Promise<string> {
	return bcrypt.hash(input, salt);
}

function dateIsInPast(date: Date): boolean {
	return date.getTime() < new Date().getTime();
}

function datePlusSeconds(date: Date, seconds: number): Date {
	const futureDate = new Date(date);
	futureDate.setTime(futureDate.getTime() + seconds * 1000);
	return futureDate;
}

function validAccessFromToken(access_token: string | undefined): Access | null {
	// Check if we even have a token to check
	if (access_token === undefined || access_token === "") return null;

	// Check if we even know this token
	const access = accessTokens.get(access_token);
	if (!access) return null;

	// Check if the expiration date is in the past
	const expirationDate = datePlusSeconds(access.created_at, access.expires_in_seconds);
	if (dateIsInPast(expirationDate)) return null;

	return access;
}

class SessionStore extends ExpressSessionStore {
	#sessions: Map<string, SessionData> = new Map();

	get(sid: string, callback: (err: unknown, session?: SessionData | null) => void): void {
		callback(undefined, this.#sessions.get(sid) ?? null);
	}

	/** Upsert a session in the store given a session ID and `SessionData` */
	set(sid: string, session: SessionData, callback?: (err?: unknown) => void): void {
		this.#sessions.set(sid, session);
		if (callback) {
			callback(undefined);
		}
	}

	/** Destroys the dession with the given session ID. */
	destroy(sid: string, callback?: (err?: unknown) => void): void {
		this.#sessions.delete(sid);
		if (callback) {
			callback(undefined);
		}
	}
}

const sessionStore = new SessionStore();

/**
 * Routes and middleware for a basic authentication flow. Installs a
 * `context` property on the request object that includes the caller's
 * authorized user ID.
 *
 * @see https://thecodebarbarian.com/oauth-with-node-js-and-express.html
 */
export function auth(this: void): Router {
	return Router()
		.use(
			sessions({
				secret: generateSecureToken(100) as string, // secret to sign the session ID cookie
				genid: () => uuid(),
				name: "accountable.connect.sid",
				saveUninitialized: true,
				resave: false,
				store: sessionStore,
				cookie: {
					maxAge: 1000 * 60 * 60 * 24, // one day
					secure: true,
					httpOnly: false,
					sameSite: "strict",
				},
			})
		)
		.post("/join", (req, res) => {
			// TODO: Get the user's username and (hashed) password, salt and hash it, and return an auth code
			const givenAccountId = req.body["account"] as unknown;
			const givenPassword = req.body["password"] as unknown;
			if (typeof givenAccountId !== "string" || typeof givenPassword !== "string") {
				res.status(400).json({ message: "Improper parameter types" });
				return;
			}

			res.json({ message: "Welcome" });
		})
		.post(
			"/login",
			asyncWrapper(async (req, res) => {
				// ** Start a session on an existing account
				// TODO: Prevent brute-forcing same user ID
				// TODO: Limit num of consecutive failed attempts by the same user name and IP
				// FIXME: We're vulnerable to CSRF attacks here

				const givenAccountId = req.body["account"] as unknown;
				const givenPassword = req.body["password"] as unknown;
				if (typeof givenAccountId !== "string" || typeof givenPassword !== "string") {
					res.status(400).json({ message: "Improper parameter types" });
					return;
				}

				// ** Get credentials
				const storedUser = userWithAccountId(givenAccountId);
				if (!storedUser) {
					res.status(403).json({ message: "Incorrect username or password" });
					return;
				}

				// ** Verify credentials
				try {
					const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
					if (!isPasswordGood) {
						res.status(403).json({ message: "Incorrect username or password" });
						return;
					}
				} catch (error: unknown) {
					console.error(error);
					res.status(500).json({ message: "Something went wrong. Try again?" });
					return;
				}

				// ** Generate an auth token and send it along
				const access_token = generateSecureToken(50) as string;
				const access: Access = {
					token: access_token,
					uid: storedUser.uid,
					created_at: new Date(),
					expires_in_seconds: 60 * 60 * 24, // one day
				};
				accessTokens.set(access_token, access);
				req.session.cookie = {
					expires: datePlusSeconds(access.created_at, access.expires_in_seconds),
					originalMaxAge: access.expires_in_seconds * 1000,
				};

				req.session.context = { auth: access };
				res.json({ access_token, expires_in: access.expires_in_seconds });
			})
		)
		.use((req, res, next) => {
			// ** Ensure the request context is valid
			// const access = validAccessFromToken(req.get("authorization"));
			const access = validAccessFromToken(req.sessionID);
			req.session.context = { auth: access };
			next();
		})
		.post("/logout", (req, res) => {
			// ** Destroy the session
			const access = req.session.context?.auth;
			if (access) {
				accessTokens.delete(access.token);
			}
			req.session.destroy((err: unknown) => {
				// eslint-disable-next-line no-extra-boolean-cast
				if (Boolean(err)) {
					console.error(err);
				}
				res.json({ message: "Success!" });
			});
		});
}

/** Makes sure the calling user is authorized here. */
export const requireAuth: RequestHandler = (req, res, next) => {
	if (!req.session.context?.auth) {
		res.status(403).json({ message: "Unauthorized" });
		return;
	}
	next();
};

/** Makes sure the request's `uid` param matches the calling user's authorization. */
export const ownersOnly: RequestHandler = (req, res, next) => {
	const uid = req.params["uid"] ?? "";
	const auth = req.session.context?.auth;
	if (!auth || !uid || !safeCompare(uid, auth.uid)) {
		res.status(403).json({ message: "Unauthorized" });
		return;
	}
	next();
};
