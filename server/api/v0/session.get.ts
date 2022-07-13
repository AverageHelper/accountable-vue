import { defineEventHandler } from "h3";
import { metadataFromRequest } from "~~/server/auth/index.js";
import { newAccessToken } from "~~/server/auth/jwt.js";
import { statsForUser } from "~~/server/database/io.js";

export default defineEventHandler(async ({ req }) => {
	// ** If the user has the cookie set, respond with a JWT for the user

	const metadata = await metadataFromRequest(req); // throws if bad

	const access_token = await newAccessToken(req, metadata.user);
	const uid = metadata.user.uid;
	const account = metadata.user.currentAccountId;
	const { totalSpace, usedSpace } = await statsForUser(uid);
	return { account, access_token, uid, totalSpace, usedSpace };
});
