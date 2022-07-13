import { collectionRef } from "~~/server/db.js";
import { defineEventHandler, useQuery } from "h3";
import { deleteCollection } from "~~/server/database/index.js";
import { NotFoundError } from "~~/server/errors/index.js";
import { statsForUser } from "~~/server/database/io.js";

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const uid: string | null = ((params["uid"] as string | undefined) ?? "") || null;
	if (uid === null) throw new NotFoundError();

	const ref = collectionRef(req);
	if (!ref) throw new NotFoundError();

	// Delete the referenced database entries
	await deleteCollection(ref);
	const { totalSpace, usedSpace } = await statsForUser(uid);

	// TODO: Also delete associated files

	return { totalSpace, usedSpace };
});
