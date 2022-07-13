import type { User } from "~~/server/database/schemas.js";
import { defineEventHandler, useBody } from "h3";
import { MAX_USERS } from "~~/server/auth/limits.js";
import { newAccessToken } from "~~/server/auth/jwt.js";
import { numberOfUsers, statsForUser, upsertUser } from "~~/server/database/io.js";
import {
	BadRequestError,
	DuplicateAccountError,
	NotEnoughRoomError,
} from "~~/server/errors/index.js";
import {
	generateHash,
	generateSalt,
	newDocumentId,
	userWithAccountId,
} from "~~/server/auth/index.js";

interface ReqBody {
	account?: unknown;
	newaccount?: unknown;
	password?: unknown;
	newpassword?: unknown;
}

export default defineEventHandler(async event => {
	const req = event.req;
	const body = await useBody<ReqBody>(event);
	const givenAccountId = body.account;
	const givenPassword = body.password;
	if (typeof givenAccountId !== "string" || typeof givenPassword !== "string") {
		throw new BadRequestError("Improper parameter types");
	}

	// ** Make sure we arent' full
	const limit = MAX_USERS;
	const current = await numberOfUsers();
	if (current >= limit) throw new NotEnoughRoomError("We're full at the moment. Try again later!");

	// ** Check credentials are unused
	const storedUser = await userWithAccountId(givenAccountId);
	if (storedUser) {
		throw new DuplicateAccountError();
	}

	// ** Store credentials
	const passwordSalt = await generateSalt();
	const passwordHash = await generateHash(givenPassword, passwordSalt);
	const uid = newDocumentId();
	const user: User = {
		uid,
		currentAccountId: givenAccountId,
		passwordHash,
		passwordSalt,
	};
	await upsertUser(user);

	// ** Generate an auth token and send it along
	const access_token = await newAccessToken(req, user);
	const { totalSpace, usedSpace } = await statsForUser(user.uid);
	return { access_token, uid, totalSpace, usedSpace };
});
