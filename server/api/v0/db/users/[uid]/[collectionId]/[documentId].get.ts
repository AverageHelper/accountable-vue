import { defineEventHandler } from "h3";
import { documentRef } from "~~/server/db.js";
import { getDocument } from "~~/server/database/index.js";
import { NotFoundError } from "~~/server/errors/index.js";

export default defineEventHandler(async event => {
	const ref = documentRef(req);
	// console.debug(`Handling GET for document at ${ref?.path ?? "null"}`);
	if (!ref) throw new NotFoundError();

	const { data } = await getDocument(ref);
	// console.debug(`Found item: ${JSON.stringify(data, undefined, "  ")}`);
	return data;
});
