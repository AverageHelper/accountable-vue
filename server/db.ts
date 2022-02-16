import type { DataItem, Unsubscribe, UserKeys } from "./database/index.js";
import type { DocUpdate } from "./database/io.js";
import type { Request } from "express";
import type { WebSocket } from "ws";
import { asyncWrapper } from "./asyncWrapper.js";
import { BadRequestError, NotFoundError, respondData, respondSuccess } from "./responses.js";
import { handleErrors } from "./handleErrors.js";
import { ownersOnly, requireAuth } from "./auth/index.js";
import { Router } from "express";
import {
	CollectionReference,
	DocumentReference,
	deleteCollection,
	deleteDocument,
	deleteDocuments,
	getCollection,
	getDocument,
	isArrayOf,
	isCollectionId,
	isDocumentWriteBatch,
	isNonEmptyArray,
	isPartialDataItem,
	isUserKeys,
	setDocument,
	setDocuments,
	watchUpdatesToCollection,
	watchUpdatesToDocument,
} from "./database/index.js";

interface Params {
	uid?: string;
	collectionId?: string;
	documentId?: string;
}

function collectionRef(req: Request<Params>): CollectionReference<DataItem> | null {
	const uid = (req.params.uid ?? "") || null;
	const collectionId = req.params.collectionId ?? "";
	if (uid === null || !isCollectionId(collectionId)) return null;

	return new CollectionReference(uid, collectionId);
}

function documentRef(req: Request<Params>): DocumentReference<DataItem> | null {
	const documentId = req.params.documentId ?? "";
	const collection = collectionRef(req);
	if (!collection) return null;

	return new DocumentReference(collection, documentId);
}

function webSocket(ws: WebSocket, req: Request<Params>): void {
	const uid = (req.params.uid ?? "") || null;
	const collectionId = (req.params.collectionId ?? "") || null;
	const documentId = (req.params.documentId ?? "") || null;
	if (uid === null || collectionId === null || !isCollectionId(collectionId)) {
		ws.send(JSON.stringify({ message: "No data found" }));
		return ws.close();
	}
	const collection = new CollectionReference<UserKeys>(uid, collectionId);
	let unsubscribe: Unsubscribe;

	// TODO: Do a dance within the websocket to assert the caller's ID is uid

	if (documentId !== null) {
		const ref = new DocumentReference(collection, documentId);
		unsubscribe = watchUpdatesToDocument(ref, data => {
			console.debug(`Got update for document at ${ref.path}`);
			ws.send(
				JSON.stringify({
					message: "Here's your data",
					dataType: "single",
					data,
				})
			);
		});
	} else {
		unsubscribe = watchUpdatesToCollection(collection, data => {
			console.debug(`Got update for collection at ${collection.path}`);
			ws.send(
				JSON.stringify({
					message: "Here's your data",
					dataType: "multiple",
					data,
				})
			);
		});
	}

	ws.on("message", msg => {
		try {
			const uid = (req.params.uid ?? "") || null;
			if ((msg as Buffer).toString() === "STOP") {
				process.stdout.write("Received STOP\n");
				unsubscribe();
				return ws.close();
			}
			process.stdout.write(
				`User '${uid ?? "null"}' sent message: '${JSON.stringify(msg.valueOf())}'\n`
			);
		} catch (error: unknown) {
			console.error(error);
		}
	});
}

// Function so we defer creation of the router until after we've set up websocket support
export function db(this: void): Router {
	return Router()
		.ws("/users/:uid/:collectionId", webSocket)
		.ws("/users/:uid/:collectionId/:documentId", webSocket)
		.use(requireAuth()) // require auth from here on in
		.use("/users/:uid", ownersOnly())
		.get<Params>(
			"/users/:uid/:collectionId",
			asyncWrapper(async (req, res) => {
				const ref = collectionRef(req);
				if (!ref) throw new NotFoundError();

				const items = await getCollection(ref);
				respondData(res, items);
			})
		)
		.get<Params>(
			"/users/:uid/:collectionId/:documentId",
			asyncWrapper(async (req, res) => {
				const ref = documentRef(req);
				// console.debug(`Handling GET for document at ${ref?.path ?? "null"}`);
				if (!ref) throw new NotFoundError();

				const item = await getDocument(ref);
				// console.debug(`Found item: ${JSON.stringify(item, undefined, "  ")}`);
				respondData(res, item);
			})
		)
		.post<Params>(
			"/users/:uid",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				// ** Batched writes
				const providedData = req.body as unknown;
				if (!isArrayOf(providedData, isDocumentWriteBatch)) throw new BadRequestError();

				// Ignore an empty batch
				if (!isNonEmptyArray(providedData)) return respondSuccess(res);

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

				respondSuccess(res);
			})
		)
		.post<Params>(
			"/users/:uid/:collectionId/:documentId",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const providedData = req.body as unknown;
				if (!isPartialDataItem(providedData) && !isUserKeys(providedData))
					throw new BadRequestError();

				const ref = documentRef(req);
				if (!ref) throw new NotFoundError();

				await setDocument(ref, providedData);
				respondSuccess(res);
			})
		)
		.delete<Params>(
			"/users/:uid/:collectionId",
			asyncWrapper(async (req, res) => {
				const ref = collectionRef(req);
				if (!ref) throw new NotFoundError();

				await deleteCollection(ref);
				respondSuccess(res);
			})
		)
		.delete<Params>(
			"/users/:uid/:collectionId/:documentId",
			asyncWrapper(async (req, res) => {
				const ref = documentRef(req);
				if (!ref) throw new NotFoundError();

				await deleteDocument(ref);
				respondSuccess(res);
			})
		)
		.use(handleErrors);
}
