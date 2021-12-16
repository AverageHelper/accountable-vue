import type { Request } from "express";
import type { User } from "../database/schemas.js";
import { generateSecureToken } from "n-digit-token";
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
	// TODO: Only blacklist for the duration the token has remaining
	const oneHour = 3600000;
	jwtBlacklist.add(token, oneHour);
}

export async function newAccessToken(user: User): Promise<string> {
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

export function jwtTokenFromRequest(req: Request): string | null {
	const authHeader = req.headers.authorization ?? "";
	if (!authHeader) return null;

	return (authHeader.split(" ")[1] ?? "") || null;
}

export async function verifyJwt(token: string): Promise<jwt.JwtPayload> {
	return new Promise<jwt.JwtPayload>((resolve, reject) => {
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
}
