import type { DataItem, Unsubscribe, UserKeys } from "./database/index.js";
import type { DocumentData } from "./database/schemas.js";
import type { DocUpdate } from "./database/io.js";
import type { Request } from "express";
import type { WebSocket } from "./database/websockets.js";
import { asyncWrapper } from "./asyncWrapper.js";
import { close, send, WebSocketCode } from "./database/websockets.js";
import { deleteItem, ensure, getFileContents, moveFile, tmpDir } from "./database/filesystem.js";
import { dirname, resolve as resolvePath, sep as pathSeparator, join } from "path";
import { env } from "./environment.js";
import { handleErrors } from "./handleErrors.js";
import { maxSpacePerUser } from "./auth/limits.js";
import { ownersOnly, requireAuth } from "./auth/index.js";
import { respondData, respondError, respondSuccess } from "./responses.js";
import { Router } from "express";
import { simplifiedByteCount } from "./transformers/simplifiedByteCount.js";
import { statsForUser } from "./database/io.js";
import multer, { diskStorage } from "multer";
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
	isDataItem,
	isDocumentWriteBatch,
	isNonEmptyArray,
	isUserKeys,
	setDocument,
	setDocuments,
	watchUpdatesToCollection,
	watchUpdatesToDocument,
} from "./database/index.js";
import {
	BadRequestError,
	InternalError,
	NotEnoughRoomError,
	NotFoundError,
} from "./errors/index.js";

interface Params {
	uid?: string;
	collectionId?: string;
	documentId?: string;
	fileName?: string;
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

/**
 * Asserts that the given value is a valid file path segment.
 *
 * @param value The path segment
 * @param name A string that identifies the value in error reports
 *
 * @throws a {@link BadRequestError} if `value` is not a valid file path segment.
 * @returns the given `value`
 */
function assertPathSegment(value: string | undefined, name: string): string {
	if (value === undefined || !value) throw new BadRequestError(`Missing ${name}`);

	// Make sure value doesn't contain a path separator
	if (value.includes(pathSeparator) || value.includes(".."))
		throw new BadRequestError(
			`${name} cannot contain a '${pathSeparator}' character or a parent directory marker`
		);

	return value.trim();
}

/**
 * Ensures that the appropriate parameters are present and valid file path segments.
 */
function requireFilePathParameters(params: Params): Required<Omit<Params, "collectionId">> {
	const { uid, documentId, fileName } = params;

	return {
		uid: assertPathSegment(uid, "uid"),
		documentId: assertPathSegment(documentId, "documentId"),
		fileName: assertPathSegment(fileName, "fileName"),
	};
}

/**
 * Returns the path to a temporary storage place for user's data.
 * The parent folder of this file path is garanteed to exist.
 *
 * @throws a {@link BadRequestError} if the given params don't form a proper file path.
 * @returns a filesystem path for the given file params, or `null` if the path is invalid.
 */
export async function temporaryFilePath(params: Params): Promise<string | null> {
	const { uid, fileName } = requireFilePathParameters(params);

	// Make sure fileName doesn't contain a path separator
	if (fileName.includes("..") || fileName.includes(pathSeparator)) return null;

	// Make sure uid doesn't contain stray path arguments
	if (uid.includes("..") || uid.includes(pathSeparator)) return null;

	const tmp = tmpDir();
	const folder = resolvePath(tmp, `./accountable-attachment-temp/users/${uid}/attachments`);

	const path = join(folder, fileName.trim());
	if (path.includes("..")) {
		console.error(`Someone might be trying a path traversal with '${path}'`);
		return null;
	}

	await ensure(folder);
	console.debug(`temporaryFilePath: ${path}`);
	return path;
}

/**
 * Returns the path to the user's data. The parent folder of this file path
 * is garanteed to exist.
 *
 * @throws a {@link BadRequestError} if the given params don't form a proper file path.
 * @returns a filesystem path for the given file params, or `null` if the path is invalid.
 */
async function permanentFilePath(params: Params): Promise<string | null> {
	const { uid, fileName } = requireFilePathParameters(params);

	// Make sure fileName doesn't contain a path separator
	if (fileName.includes("..") || fileName.includes(pathSeparator)) return null;

	// Make sure uid doesn't contain stray path arguments
	if (uid.includes("..") || uid.includes(pathSeparator)) return null;

	const DB_ROOT = env("DB") ?? resolvePath("./db");
	const folder = resolvePath(DB_ROOT, `./users/${uid}/attachments`);

	const path = join(folder, fileName.trim());
	if (path.includes("..")) {
		console.error(`Someone might be trying a path traversal with '${path}'`);
		return null;
	}

	await ensure(folder);
	console.debug(
		`permanentFilePath(params: { uid: ${params.uid ?? "undefined"}, fileName: ${
			params.fileName ?? "undefined"
		} }): ${path}`
	);
	return path;
}

const upload = multer({
	limits: {
		fileSize: 50000000, // 50 MB
		files: 1,
	},
	storage: diskStorage({
		destination(req, _, cb) {
			// eslint-disable-next-line promise/prefer-await-to-then
			void temporaryFilePath(req.params).then(tmp => {
				/* eslint-disable promise/no-callback-in-promise */
				if (tmp === null) {
					cb(new BadRequestError("Your UID or that file name don't add up to a valid path"), "");
					return;
				}
				const path = dirname(tmp);
				console.debug(`Writing uploaded file to '${path}'...`);
				if (path === null || !path) {
					cb(new BadRequestError("Your UID or that file name don't add up to a valid path"), "");
				} else {
					cb(null, path);
				}
				/* eslint-enable promise/no-callback-in-promise */
			});
		},
		filename(req, _, cb) {
			// Use the given file name
			try {
				const { fileName } = requireFilePathParameters(req.params);
				if (fileName.includes("..")) {
					console.error(`Someone might be trying a path traversal with '${fileName}'`);
					cb(new BadRequestError("That file name doesn't add up to a valid path"), "");
					return;
				}
				cb(null, fileName);
			} catch (error) {
				if (error instanceof Error) {
					cb(error, "");
				} else if (typeof error === "string") {
					cb(new Error(error), "");
				} else {
					cb(new Error(JSON.stringify(error)), "");
				}
			}
		},
	}),
});

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

interface FileData {
	contents: string;
	_id: string;
}

// Function so we defer creation of the router until after we've set up websocket support
export function db(this: void): Router {
	return Router()
		.ws("/users/:uid/:collectionId", webSocket)
		.ws("/users/:uid/:collectionId/:documentId", webSocket)
		.use(requireAuth) // require auth from here on in
		.use("/users/:uid", ownersOnly)
		.get<Params>(
			"/users/:uid/attachments/:documentId/blob/:fileName",
			asyncWrapper(async (req, res) => {
				const path = await permanentFilePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				const contents = await getFileContents(path);
				const fileData: DocumentData<FileData> = {
					contents,
					_id: req.params.fileName ?? "unknown",
				};
				respondData(res, fileData);
			})
		)
		.post(
			"/users/:uid/attachments/:documentId/blob/:fileName",
			upload.single("file"),
			asyncWrapper<Params>(async (req, res) => {
				const uid: string | null = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const { totalSpace, usedSpace } = await statsForUser(uid);
				const userSizeDesc = simplifiedByteCount(usedSpace);
				const maxSpacDesc = simplifiedByteCount(maxSpacePerUser);
				console.debug(`User ${uid} has used ${userSizeDesc} of ${maxSpacDesc}`);

				const remainingSpace = totalSpace - usedSpace;
				if (remainingSpace <= 0) throw new NotEnoughRoomError();

				// Move the file from the staging area into permanet storage
				const tempPath = await temporaryFilePath(req.params);
				const permPath = await permanentFilePath(req.params);

				if (tempPath === null || permPath === null) {
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");
				}

				await moveFile(tempPath, permPath);

				{
					const { totalSpace, usedSpace } = await statsForUser(uid);
					respondSuccess(res, { totalSpace, usedSpace });
				}
			})
		)
		.delete<Params>(
			"/users/:uid/attachments/:documentId/blob/:fileName",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const path = await permanentFilePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				try {
					await deleteItem(path);
				} catch (error) {
					if (error instanceof InternalError) {
						return respondError(res, error);
					}
					console.error(`Unknown error`, error);
					return respondError(res, new InternalError());
				}

				// Report the user's new usage
				const { totalSpace, usedSpace } = await statsForUser(uid);
				const userSizeDesc = simplifiedByteCount(usedSpace);
				const maxSpacDesc = simplifiedByteCount(maxSpacePerUser);
				console.debug(`User ${uid} has used ${userSizeDesc} of ${maxSpacDesc}`);

				// When done, get back to the caller with new stats
				respondSuccess(res, { totalSpace, usedSpace });
			})
		)
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

				const { data } = await getDocument(ref);
				// console.debug(`Found item: ${JSON.stringify(data, undefined, "  ")}`);
				respondData(res, data);
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
				if (!isDataItem(providedData) && !isUserKeys(providedData)) throw new BadRequestError();

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

				// Delete the referenced database entries
				await deleteCollection(ref);
				const { totalSpace, usedSpace } = await statsForUser(uid);

				// TODO: Also delete associated files

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

				// Delete the referenced database entry
				await deleteDocument(ref);

				const { totalSpace, usedSpace } = await statsForUser(uid);

				// TODO: Delete any associated files

				respondSuccess(res, { totalSpace, usedSpace });
			})
		)
		.use(handleErrors);
}
