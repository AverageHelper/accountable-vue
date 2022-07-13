import { NotFoundError } from "~~/server/errors/index.js";
import { defineEventHandler, useQuery } from "h3";
import { deleteDocument } from "~~/server/database/index.js";
import { documentRef } from "~~/server/db.js";
import { statsForUser } from "~~/server/database/io.js";

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const uid: string | null = ((params["uid"] as string | undefined) ?? "") || null;
	if (uid === null) throw new NotFoundError();

	const ref = documentRef(req);
	if (!ref) throw new NotFoundError();

	// Delete the referenced database entry
	await deleteDocument(ref);

	const { totalSpace, usedSpace } = await statsForUser(uid);

	// TODO: Delete any associated files

	return { totalSpace, usedSpace };
});
