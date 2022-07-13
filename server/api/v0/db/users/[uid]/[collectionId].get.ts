import { collectionRef } from "~~/server/db.js";
import { defineEventHandler } from "h3";
import { getCollection } from "~~/server/database/index.js";
import { NotFoundError } from "~~/server/errors/index.js";

export default defineEventHandler(async event => {
	const ref = collectionRef(req);
	if (!ref) throw new NotFoundError();

	const items = await getCollection(ref);
	return items;
});
