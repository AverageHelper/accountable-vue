import { BadRequestError, NotEnoughRoomError, NotFoundError } from "~~/server/errors/index.js";
import { defineEventHandler, useQuery } from "h3";
import { moveFile } from "~~/server/database/filesystem.js";
import { permanentFilePath, temporaryFilePath } from "~~/server/db.js";
import { statsForUser } from "~~/server/database/io.js";
import { simplifiedByteCount } from "~~/transformers/index.js";
import { maxSpacePerUser } from "~~/server/auth/index.js";

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const uid: string | null = ((params["uid"] as string | undefined) ?? "") || null;
	if (uid === null) throw new NotFoundError();

	const { totalSpace, usedSpace } = await statsForUser(uid);
	const userSizeDesc = simplifiedByteCount(usedSpace);
	const maxSpacDesc = simplifiedByteCount(maxSpacePerUser);
	console.debug(`User ${uid} has used ${userSizeDesc} of ${maxSpacDesc}`);

	const remainingSpace = totalSpace - usedSpace;
	if (remainingSpace <= 0) throw new NotEnoughRoomError();

	// Move the file from the staging area into permanet storage
	const tempPath = await temporaryFilePath(params);
	const permPath = await permanentFilePath(params);

	if (tempPath === null || permPath === null) {
		throw new BadRequestError("Your UID or that file name don't add up to a valid path");
	}

	await moveFile(tempPath, permPath);

	{
		const { totalSpace, usedSpace } = await statsForUser(uid);
		return { totalSpace, usedSpace };
	}
});
