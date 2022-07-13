import type { DocumentData } from "~~/server/database/schemas.js";
import { BadRequestError } from "~~/server/errors/index.js";
import { defineEventHandler, useQuery } from "h3";
import { getFileContents } from "~~/server/database/filesystem.js";
import { permanentFilePath } from "~~/server/db.js";

interface FileData {
	contents: string;
	_id: string;
}

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const path = await permanentFilePath(params);
	if (path === null)
		throw new BadRequestError("Your UID or that file name don't add up to a valid path");

	const contents = await getFileContents(path);
	const fileData: DocumentData<FileData> = {
		contents,
		_id: (params["fileName"] as string | undefined) ?? "unknown",
	};
	return fileData;
});
