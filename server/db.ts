import type { DataItem, Unsubscribe, UserKeys } from "./database/index.js";
import type { DocUpdate } from "./database/io.js";
import type { Request } from "express";
import type { WebSocket } from "./database/websockets.js";
import { asyncWrapper } from "./asyncWrapper.js";
import { BadRequestError, NotFoundError } from "./errors/index.js";
import { close, send, WebSocketCode } from "./database/websockets.js";
import { handleErrors } from "./handleErrors.js";
import { ownersOnly, requireAuth } from "./auth/index.js";
import { respondData, respondSuccess } from "./responses.js";
import { Router } from "express";
import { statsForUser } from "./database/io.js";
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

	// Ensure valid input
	if (uid === null) return close(ws, WebSocketCode.PROTOCOL_ERROR, "Missing user ID");
	if (collectionId === null)
		return close(ws, WebSocketCode.PROTOCOL_ERROR, "Missing collection ID");
	if (!isCollectionId(collectionId))
		return close(ws, WebSocketCode.PROTOCOL_ERROR, "Invalid collection ID");

	// Send an occasional ping
	// If the client doesn't respond a few times consecutively, assume they aren't coming back
	let timesNotThere = 0;
	const pingInterval = setInterval(() => {
		if (timesNotThere > 5) {
			process.stdout.write("Client didn't respond after 5 tries. Closing\n");
			close(ws, WebSocketCode.WENT_AWAY, "Client did not respond to pings, probably dead");
			clearInterval(pingInterval);
			return;
		}
		send(ws, "ARE_YOU_STILL_THERE");
		timesNotThere += 1; // this goes away if the client responds
	}, 10000); // 10 second interval

	const collection = new CollectionReference<UserKeys>(uid, collectionId);
	let unsubscribe: Unsubscribe;

	// TODO: Do a dance within the websocket to assert the caller's ID is uid

	if (documentId !== null) {
		const ref = new DocumentReference(collection, documentId);
		unsubscribe = watchUpdatesToDocument(ref, data => {
			console.debug(`Got update for document at ${ref.path}`);
			send(ws, {
				message: "Here's your data",
				dataType: "single",
				data,
			});
		});
	} else {
		unsubscribe = watchUpdatesToCollection(collection, data => {
			console.debug(`Got update for collection at ${collection.path}`);
			send(ws, {
				message: "Here's your data",
				dataType: "multiple",
				data,
			});
		});
	}

	ws.on("message", msg => {
		try {
			const message = (msg as Buffer).toString();

			// ** Stuff we expect to hear from the client:
			switch (message) {
				case "START": // nop
				case "YES_IM_STILL_HERE":
					timesNotThere = 0;
					return;
				case "STOP":
					unsubscribe();
					return close(ws, WebSocketCode.NORMAL, "Received STOP message from client");
				default:
					return close(ws, WebSocketCode.PROTOCOL_ERROR, "Received unknown message from client");
			}
		} catch (error) {
			console.error(error);
			close(ws, WebSocketCode.PROTOCOL_ERROR, "Couldn't process that");
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
				if (!isNonEmptyArray(providedData)) {
					const { totalSpace, usedSpace } = await statsForUser(uid);
					return respondSuccess(res, { totalSpace, usedSpace });
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
				respondSuccess(res, { totalSpace, usedSpace });
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
				const { totalSpace, usedSpace } = await statsForUser(uid);
				respondSuccess(res, { totalSpace, usedSpace });
			})
		)
		.delete<Params>(
			"/users/:uid/:collectionId",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const ref = collectionRef(req);
				if (!ref) throw new NotFoundError();

				await deleteCollection(ref);
				const { totalSpace, usedSpace } = await statsForUser(uid);
				respondSuccess(res, { totalSpace, usedSpace });
			})
		)
		.delete<Params>(
			"/users/:uid/:collectionId/:documentId",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const ref = documentRef(req);
				if (!ref) throw new NotFoundError();

				await deleteDocument(ref);
				const { totalSpace, usedSpace } = await statsForUser(uid);
				respondSuccess(res, { totalSpace, usedSpace });
			})
		)
		.use(handleErrors);
}
