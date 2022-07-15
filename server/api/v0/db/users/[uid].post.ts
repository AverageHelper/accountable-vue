import type { DataItem } from "~~/server/database/index.js";
import type { DocUpdate } from "~~/server/database/io.js";
import { BadRequestError, NotFoundError } from "~~/server/errors/index.js";
import { defineEventHandler, useBody, useQuery } from "h3";
import { statsForUser } from "~~/server/database/io.js";
import { version as appVersion } from "~~/version.js";
import {
	CollectionReference,
	deleteDocuments,
	DocumentReference,
	isArrayOf,
	isDocumentWriteBatch,
	isNonEmptyArray,
	setDocuments,
} from "~~/server/database/index.js";
import { env } from "~~/server/environment.js";

const PORT = env("PORT");

process.stdout.write(
	`Accountable storage server v${appVersion} listening on port ${PORT ?? "'unknown'"}\n`
);

export default defineEventHandler(async event => {
	const params = useQuery(event);
	const uid: string | null = ((params["uid"] as string | undefined) ?? "") || null;
	if (uid === null) throw new NotFoundError();

	// ** Batched writes
	const providedData = await useBody<unknown>(event);
	if (!isArrayOf(providedData, isDocumentWriteBatch)) throw new BadRequestError();

	// Ignore an empty batch
	if (!isNonEmptyArray(providedData)) {
		const { totalSpace, usedSpace } = await statsForUser(uid);
		return { totalSpace, usedSpace };
	}

	// Separate delete and set operations
	const setOperations: Array<DocUpdate<DataItem>> = [];
	const deleteOperations: Array<DocumentReference<DataItem>> = [];
	for (const write of providedData) {
		const collection = new CollectionReference(uid, write.ref.collectionId);
		const ref = new DocumentReference<DataItem>(collection, write.ref.documentId);

		switch (write.type) {
			case "set":
				setOperations.push({ ref, data: write.data });
				break;
			case "delete":
				deleteOperations.push(ref);
				break;
		}
	}

	// Run sets
	if (isNonEmptyArray(setOperations)) {
		await setDocuments(setOperations);
	}

	// Run deletes
	if (isNonEmptyArray(deleteOperations)) {
		await deleteDocuments(deleteOperations);
	}

	const { totalSpace, usedSpace } = await statsForUser(uid);
	return { totalSpace, usedSpace };
});
