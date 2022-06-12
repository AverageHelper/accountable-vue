import type { JwtPayload, User } from "../database/schemas.js";
import type { Request } from "express";
import { generateSecureToken } from "n-digit-token";
import { isJwtPayload } from "../database/schemas.js";
import { TemporarySet } from "./TemporarySet.js";
import jwt from "jsonwebtoken";

// Generate a new JWT secret for every run.
// Restarting the server will log out all users.
const secret = generateSecureToken(25) as string;

const jwtBlacklist = new TemporarySet<string>();

export function blacklistHasJwt(token: string): boolean {
	return jwtBlacklist.has(token);
}

export function addJwtToBlacklist(token: string): void {
	const jwt = unverifiedJwt(token);

	// Only blacklist for the duration the token has remaining
	let timeout = 3600000; // default to one hour
	if (jwt !== null && typeof jwt !== "string") {
		const timeLeft = 3600000 - (Date.now() - (jwt.iat ?? timeout));
		process.stdout.write(`JWT has ${-timeLeft}ms left\n`);
		timeout = Math.min(timeout, timeLeft);
	}
	if (timeout > 0) {
		jwtBlacklist.add(token, timeout);
	}
}

export async function newAccessToken(user: User): Promise<string> {
	const options: jwt.SignOptions = { expiresIn: "1h" };
	const payload: JwtPayload = {
		uid: user.uid,
		hash: user.passwordHash,
	};

	return await new Promise<string>((resolve, reject) => {
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
}

export function jwtTokenFromRequest(req: Request): string | null {
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
