import { BadRequestError, UnauthorizedError } from "~~/server/errors/index.js";
import { defineEventHandler, useBody } from "h3";
import { generateHash, generateSalt, userWithAccountId } from "~~/server/auth/index.js";
import { upsertUser } from "~~/server/database/io.js";
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
	const newGivenPassword = body.newpassword;
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
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Verify old credentials
	const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
	if (!isPasswordGood) {
		throw new UnauthorizedError("wrong-credentials");
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
});
