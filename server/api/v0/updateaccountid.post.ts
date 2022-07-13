import { BadRequestError, UnauthorizedError } from "~~/server/errors/index.js";
import { defineEventHandler, useBody } from "h3";
import { upsertUser } from "~~/server/database/io.js";
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
	const newGivenAccountId = body.newaccount;
	const givenPassword = body.password;
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
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Verify old credentials
	const isPasswordGood = await bcrypt.compare(givenPassword, storedUser.passwordHash);
	if (!isPasswordGood) {
		throw new UnauthorizedError("wrong-credentials");
	}

	// ** Store new credentials
	await upsertUser({
		...storedUser,
		currentAccountId: newGivenAccountId,
	});

	// TODO: Invalidate the old jwt, send a new one
});
