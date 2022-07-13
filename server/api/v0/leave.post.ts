import { BadRequestError, UnauthorizedError } from "~~/server/errors/index.js";
import { defineEventHandler, useBody } from "h3";
import { destroyUser } from "~~/server/database/io.js";
import { userWithAccountId } from "~~/server/auth/index.js";
import bcrypt from "bcrypt";

interface ReqBody {
	account?: unknown;
	newaccount?: unknown;
	password?: unknown;
	newpassword?: unknown;
}

export default defineEventHandler(async event => {
	// Ask for full credentials, so we aren't leaning on a repeatable token
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
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Verify credentials
	const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
	if (!isPasswordGood) {
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Delete the user
	await destroyUser(storedUser.uid);
});
