import { BadRequestError, UnauthorizedError } from "~~/server/errors/index.js";
import { defineEventHandler, useBody } from "h3";
import { newAccessToken } from "~~/server/auth/jwt.js";
import { statsForUser } from "~~/server/database/io.js";
import { userWithAccountId } from "~~/server/auth/index.js";
import bcrypt from "bcrypt";

interface ReqBody {
	account?: unknown;
	newaccount?: unknown;
	password?: unknown;
	newpassword?: unknown;
}

export default defineEventHandler(async event => {
	// ** Create a JWT for the caller to use later

	const body = await useBody<ReqBody>(event);
	const givenAccountId = body.account;
	const givenPassword = body.password;
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
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Verify credentials
	const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
	if (!isPasswordGood) {
		console.debug(`The given password doesn't match what's stored`);
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Generate an auth token and send it along
	const access_token = await newAccessToken(req, storedUser);
	const uid = storedUser.uid;
	const { totalSpace, usedSpace } = await statsForUser(uid);
	return { access_token, uid, totalSpace, usedSpace };
});
