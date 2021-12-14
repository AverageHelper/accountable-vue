import type { DataItem, Keys } from "./database/index.js";
import type { Request } from "express";
import { asyncWrapper } from "./asyncWrapper.js";
import { ownersOnly } from "./auth/index.js";
import { Router } from "express";
import { respondBadRequest, respondData, respondNotFound, respondSuccess } from "./responses.js";
import {
	CollectionReference,
	DocumentReference,
	deleteCollection,
	deleteDocument,
	getCollection,
	getDocument,
	isCollectionId,
	isDataItem,
	isKeys,
	setDocument,
	watchUpdatesToCollection,
	watchUpdatesToDocument,
} from "./database/index.js";

interface Params {
	uid?: string;
	collectionId?: string;
	documentId?: string;
}

function collectionRef(req: Request<Params>): CollectionReference<DataItem> | null {
	const collectionId = req.params.collectionId ?? "";
	if (!isCollectionId(collectionId)) return null;

	return new CollectionReference(collectionId);
}

function documentRef(req: Request<Params>): DocumentReference<DataItem> | null {
	const documentId = req.params.documentId ?? "";
	const collection = collectionRef(req);
	if (!collection) return null;

	return new DocumentReference(collection, documentId);
}

export function db(this: void): Router {
	return (
		Router()
			.use("/users/:uid/*", ownersOnly())

			// ** User Preferences
			.ws("/users/:uid", (ws, req) => {
				const uid = (req.params["uid"] ?? "") || null;
				if (uid === null) {
					ws.send(JSON.stringify({ message: "No data found" }));
					return ws.close();
				}
				const collection = new CollectionReference<Keys>("users");
				const ref = new DocumentReference(collection, uid);

				const unsubscribe = watchUpdatesToDocument(ref, changes => {
					ws.send(JSON.stringify(changes));
				});

				ws.on("message", msg => {
					try {
						const uid = (req.params["uid"] ?? "") || null;
						if ((msg as Buffer).toString() === "STOP") {
							process.stdout.write("Received STOP\n");
							unsubscribe();
							ws.send(JSON.stringify({ message: "Closed." }));
							return ws.close();
						}
						process.stdout.write(
							`User '${uid ?? "null"}' sent message: '${JSON.stringify(msg.valueOf())}'\n`
						);
						ws.send(JSON.stringify({ message: "TODO: Watch the user's encrypted preference doc" }));
					} catch (error: unknown) {
						console.error(error);
					}
				});
			})
			.get<Params>(
				"/users/:uid",
				asyncWrapper(async (req, res) => {
					const uid = (req.params.uid ?? "") || null;
					if (uid === null) return respondNotFound(res);

					const collection = new CollectionReference<Keys>("users");
					const ref = new DocumentReference(collection, uid);

					const item = await getDocument(ref);
					respondData(res, item);
				})
			)
			.post<Params>(
				"/users/:uid",
				asyncWrapper(async (req, res) => {
					const uid = (req.params.uid ?? "") || null;
					if (uid === null) return respondNotFound(res);

					const collection = new CollectionReference<Keys>("users");
					const ref = new DocumentReference(collection, uid);

					const providedData = JSON.parse(req.body as string) as unknown;
					if (!isKeys(providedData)) return respondBadRequest(res);

					await setDocument(ref, {
						...providedData,
						_id: ref.id,
						uid,
					});
					respondSuccess(res);
				})
			)
			.delete<Params>(
				"/users/:uid",
				asyncWrapper(async (req, res) => {
					const uid = (req.params.uid ?? "") || null;
					if (uid === null) return respondNotFound(res);

					const collection = new CollectionReference<Keys>("users");
					const ref = new DocumentReference(collection, uid);

					await deleteDocument(ref);
					respondSuccess(res);
				})
			)

			// ** Everything else
			.ws("/users/:uid/:collectionId", (ws, req) => {
				const ref = collectionRef(req);
				if (!ref) {
					ws.send(JSON.stringify({ message: "No data found" }));
					return ws.close();
				}
				const unsubscribe = watchUpdatesToCollection(ref, changes => {
					ws.send(JSON.stringify(changes));
				});

				ws.on("message", msg => {
					try {
						if ((msg as Buffer).toString() === "STOP") {
							process.stdout.write("Received STOP\n");
							unsubscribe();
							ws.send(JSON.stringify({ message: "Closed." }));
							return ws.close();
						}
						const uid = (req.params["uid"] ?? "") || null;
						process.stdout.write(
							`User '${uid ?? "null"}' sent message: '${JSON.stringify(msg.valueOf())}'\n`
						);
						ws.send(JSON.stringify({ message: "TODO: Watch the user's encrypted preference doc" }));
					} catch (error: unknown) {
						console.error(error);
					}
				});
			})
			.ws("/users/:uid/:collectionId/:documentId", (ws, req) => {
				const ref = documentRef(req);
				if (!ref) {
					ws.send(JSON.stringify({ message: "No data found" }));
					return ws.close();
				}
				const unsubscribe = watchUpdatesToDocument(ref, change => {
					ws.send(JSON.stringify(change));
				});

				ws.on("message", msg => {
					try {
						const uid = (req.params["uid"] ?? "") || null;
						if ((msg as Buffer).toString() === "STOP") {
							process.stdout.write("Received STOP\n");
							unsubscribe();
							ws.send(JSON.stringify({ message: "Closed." }));
							return ws.close();
						}
						process.stdout.write(
							`User '${uid ?? "null"}' sent message: '${JSON.stringify(msg.valueOf())}'\n`
						);
						ws.send(JSON.stringify({ message: "TODO: Watch the user's encrypted preference doc" }));
					} catch (error: unknown) {
						console.error(error);
					}
				});
			})
			.get<Params>(
				"/users/:uid/:collectionId",
				asyncWrapper(async (req, res) => {
					const ref = collectionRef(req);
					if (!ref) return respondNotFound(res);

					const items = await getCollection(ref);
					respondData(res, items);
				})
			)
			.get<Params>(
				"/users/:uid/:collectionId/:documentId",
				asyncWrapper(async (req, res) => {
					const ref = documentRef(req);
					if (!ref) return respondNotFound(res);

					const item = await getDocument(ref);
					respondData(res, item);
				})
			)
			.post<Params>(
				"/users/:uid/:collectionId/:documentId",
				asyncWrapper(async (req, res) => {
					const uid = (req.params.uid ?? "") || null;
					const ref = documentRef(req);
					if (!ref || uid === null) return respondNotFound(res);

					const providedData = JSON.parse(req.body as string) as unknown;
					if (!isDataItem(providedData)) return respondBadRequest(res);

					await setDocument(ref, {
						...providedData,
						_id: ref.id,
						uid,
					});
					respondSuccess(res);
				})
			)
			.delete<Params>(
				"/users/:uid/:collectionId",
				asyncWrapper(async (req, res) => {
					const ref = collectionRef(req);
					if (!ref) return respondNotFound(res);

					await deleteCollection(ref);
					respondSuccess(res);
				})
			)
			.delete<Params>(
				"/users/:uid/:collectionId/:documentId",
				asyncWrapper(async (req, res) => {
					const ref = documentRef(req);
					if (!ref) return respondNotFound(res);

					await deleteDocument(ref);
					respondSuccess(res);
				})
			)
	);
}
