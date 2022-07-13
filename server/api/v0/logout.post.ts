import { addJwtToBlacklist, jwtTokenFromRequest } from "~~/server/auth/jwt.js";
import { defineEventHandler } from "h3";

export default defineEventHandler(({ req }) => {
	const token = jwtTokenFromRequest(req);
	if (token === null) {
		return;
	}

	// ** Blacklist the JWT
	addJwtToBlacklist(token);

	req.session = null;
});
