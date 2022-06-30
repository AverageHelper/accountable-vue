import type { JwtPayload, User } from "../database/schemas.js";
import type { Request } from "express";
import { generateSecureToken } from "n-digit-token";
import { isJwtPayload } from "../database/schemas.js";
import { TemporarySet } from "./TemporarySet.js";
import cookieSession from "cookie-session";
import jwt from "jsonwebtoken";

// Generate a new JWT secret for every run.
// Restarting the server will log out all users.
const secret = generateSecureToken(25) as string;

const ONE_HOUR = 60 * 60 * 1000;

// see https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely
export const session = cookieSession({
	name: "sessionToken",
	// keys: ["...", "...."], // `secret` is used if not provided. Research these keys.
	secret,
	// secure: /* varies based on whether the request came from an HTTP or HTTPS source */,
	httpOnly: true,
	sameSite: "strict",
	path: "/v0",
	maxAge: ONE_HOUR,
});

// const jwtWhitelist = new TemporarySet<string>();
const jwtBlacklist = new TemporarySet<string>();

export function blacklistHasJwt(token: string): boolean {
	return jwtBlacklist.has(token);
}

export function addJwtToBlacklist(token: string): void {
	const jwt = unverifiedJwt(token);

	// Only blacklist for the duration the token has remaining
	let timeout = ONE_HOUR; // default to one hour
	if (jwt !== null && typeof jwt !== "string") {
		const timeLeft = ONE_HOUR - (Date.now() - (jwt.iat ?? timeout));
		process.stdout.write(`JWT has ${-timeLeft}ms left\n`);
		timeout = Math.min(timeout, timeLeft);
	}
	if (timeout > 0) {
		jwtBlacklist.add(token, timeout);
	}
}

// TODO: Be smarter about session storage. See https://gist.github.com/soulmachine/b368ce7292ddd7f91c15accccc02b8df
export async function newAccessToken(req: Pick<Request, "session">, user: User): Promise<string> {
	const options: jwt.SignOptions = { expiresIn: "1h" };
	const payload: JwtPayload = {
		uid: user.uid,
		hash: user.passwordHash,
	};

	const token = await new Promise<string>((resolve, reject) => {
		jwt.sign(payload, secret, options, (err, token) => {
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

	req.session ??= { token };
	req.session.token = token;

	return token;
}

declare global {
	namespace CookieSessionInterfaces {
		interface CookieSessionObject {
			token?: string;
		}
	}
}

export function jwtTokenFromRequest(req: Pick<Request, "session" | "headers">): string | null {
	// Get session token if it exists
	if (req.session?.token !== undefined && req.session.token) {
		return req.session.token;
	}

	// No session? Check auth header instead
	const authHeader = req.headers.authorization ?? "";
	if (!authHeader) return null;

	return (authHeader.split(" ")[1] ?? "") || null;
}

function unverifiedJwt(token: string): string | jwt.JwtPayload | null {
	return jwt.decode(token);
}

export async function verifyJwt(token: string): Promise<jwt.JwtPayload> {
	return await new Promise<jwt.JwtPayload>((resolve, reject) => {
		jwt.verify(token, secret, (err, payload) => {
			// Fail if failed i guess
			if (err) return reject(err);

			// Check payload contents
			if (payload !== undefined) {
				if (!isJwtPayload(payload))
					return reject(new TypeError(`Malformed JWT: ${JSON.stringify(payload)}`));

				// Parameters are valid!
				return resolve(payload);
			}

			// Sanity check. We should never get here.
			const error = new TypeError(
				"Failed to verify JWT: Both error and payload parameters were empty."
			);
			return reject(error);
		});
	});
}
