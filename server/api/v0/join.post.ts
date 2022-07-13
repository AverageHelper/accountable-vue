import { defineEventHandler } from "h3";

import type { User } from "../../database/schemas.js";
import { BadRequestError, DuplicateAccountError, NotEnoughRoomError } from "../../errors/index.js";
import { MAX_USERS } from "../../auth/limits.js";
import { newAccessToken } from "../../auth/jwt.js";
import { numberOfUsers, statsForUser, upsertUser } from "../../database/io.js";
import { generateHash, generateSalt, newDocumentId, userWithAccountId } from "../../auth";

interface ReqBody {
	account?: unknown;
	newaccount?: unknown;
	password?: unknown;
	newpassword?: unknown;
}

export default defineEventHandler(async event => {
	const req = event.req;
	const givenAccountId = req.body.account;
	const givenPassword = req.body.password;
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
