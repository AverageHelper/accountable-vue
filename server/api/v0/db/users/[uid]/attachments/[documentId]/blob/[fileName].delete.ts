import { BadRequestError, InternalError, NotFoundError } from "~~/server/errors/index.js";
import { defineEventHandler, useQuery } from "h3";
import { deleteItem } from "~~/server/database/filesystem.js";
import { maxSpacePerUser } from "~~/server/auth/index.js";
import { permanentFilePath } from "~~/server/db.js";
import { respondError } from "~~/server/responses.js";
import { simplifiedByteCount } from "~~/transformers/index.js";
import { statsForUser } from "~~/server/database/io.js";

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const uid: string | null = ((params["uid"] as string | undefined) ?? "") || null;
	if (uid === null) throw new NotFoundError();

	const path = await permanentFilePath(req.params);
	if (path === null)
		throw new BadRequestError("Your UID or that file name don't add up to a valid path");

	try {
		await deleteItem(path);
	} catch (error) {
		if (error instanceof InternalError) {
			return respondError(res, error);
		}
		console.error(`Unknown error`, error);
		return respondError(res, new InternalError());
	}

	// Report the user's new usage
	const { totalSpace, usedSpace } = await statsForUser(uid);
	const userSizeDesc = simplifiedByteCount(usedSpace);
	const maxSpacDesc = simplifiedByteCount(maxSpacePerUser);
	console.debug(`User ${uid} has used ${userSizeDesc} of ${maxSpacDesc}`);

	// When done, get back to the caller with new stats
	return { totalSpace, usedSpace };
});
