import { BadRequestError, NotFoundError } from "~~/server/errors/index.js";
import { defineEventHandler, useBody, useQuery } from "h3";
import { documentRef } from "~~/server/db.js";
import { isDataItem, isUserKeys, setDocument } from "~~/server/database/index.js";
import { statsForUser } from "~~/server/database/io.js";

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const uid: string | null = ((params["uid"] as string | undefined) ?? "") || null;
	if (uid === null) throw new NotFoundError();

	const providedData = await useBody<unknown>(event);
	if (!isDataItem(providedData) && !isUserKeys(providedData)) throw new BadRequestError();

	const ref = documentRef(req);
	if (!ref) throw new NotFoundError();

	await setDocument(ref, providedData);
	const { totalSpace, usedSpace } = await statsForUser(uid);
	return { totalSpace, usedSpace };
});
