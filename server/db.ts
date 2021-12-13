import type { DataItem } from "./database/index.js";
import type { Request, RequestHandler, Response } from "express";
import type WebSocket from "ws";
import { asyncWrapper } from "./asyncWrapper.js";
import { Context, ownersOnly } from "./auth/index.js";
import { Router } from "express";
import { DocumentReference, deleteDocument, getDocument, setDocument } from "./database/index.js";

// Database data storage
//   WS path -> open websocket to watch a document or a series of documents on a database path
//   GET path -> get data in JSON format
//   POST path data -> database set
//   DELETE path -> database delete

function respondSuccess(this: void, req: Request, res: Response): void {
	res.json({ message: "Success!" });
}

function respondData(this: void, req: Request, res: Response, data: unknown): void {
	res.json(data);
}

function respondNotSignedIn(this: void, req: Request, res: Response): void {
	res.status(403).json({ message: "You must sign in first" });
}

function respondNotFound(this: void, req: Request, res: Response): void {
	res.status(404).json({ message: "No data found" });
}

function respondBadMethod(this: void, req: Request, res: Response): void {
	res.status(405).json({ message: "That method is not allowed here. What are you trying to do?" });
}

function respondInternalError(this: void, req: Request, res: Response): void {
	res.status(500).json({ message: "Not sure what went wrong. Try again maybe?" });
}

function _requireUid(this: void, req: Request, respondIfNoUid: () => void): string {
	// ownersOnly garantees that the request contains a valid JWT and that JWT points to the user whose data we're requesting. Throw if this is not the case.
	const uid = Context.get(req)?.uid ?? null;
	if (uid === null) {
		respondIfNoUid();
		// Force-stop if the UID is not found
		throw new TypeError(
			"No UID in request. Make sure to use `ownersOnly` before reaching this point."
		);
	}
	return uid;
}

function requireUid(this: void, req: Request, res: Response): string {
	return _requireUid(req, () => respondNotSignedIn(req, res));
}

function requireUidWs(this: void, req: Request, ws: WebSocket): string {
	return _requireUid(req, () => {
		const response = { code: 403, message: "You must sign in first" };
		ws.send(JSON.stringify(response), error => {
			if (error) {
				console.error(error);
			}
			ws.close(403);
		});
	});
}

/**
 * Generates Create-Read-Update-Delete (CRUD) endpoints for the document at the given path.
 *
 * This handler accepts only GET, POST, and DELETE requests. Any other method will throw
 * an HTTP 405 error.
 *
 * @param path The document path to handle here.
 * @returns a handler that handles CRUD endpoints for the given document path.
 */
function documentCrud(this: void, path: string): RequestHandler {
	return asyncWrapper(async (req, res) => {
		try {
			const ref = new DocumentReference(path);
			switch (req.method.toUpperCase()) {
				case "GET": {
					const data = await getDocument(ref);
					if (data === null) return respondNotFound(req, res);
					return respondData(req, res, data);
				}
				case "POST":
					await setDocument(ref, req.body as DataItem);
					return respondSuccess(req, res);
				case "DELETE":
					await deleteDocument(ref);
					return respondSuccess(req, res);
				default:
					return respondBadMethod(req, res);
			}
		} catch (error: unknown) {
			console.error(error);
			respondInternalError(req, res);
		}
	});
}

export function db(this: void): Router {
	const dbRouter = Router().all("/users/:uid/*", ownersOnly());

	// ** User Preferences
	dbRouter
		.ws("/", (ws, req) => {
			ws.on("message", msg => {
				try {
					const uid = requireUidWs(req, ws);
					process.stdout.write(`User '${uid}' sent message: '${JSON.stringify(msg.valueOf())}'\n`);
					ws.send(JSON.stringify({ message: "TODO: Watch the user's encrypted preference doc" }));
				} catch (error: unknown) {
					console.error(error);
				}
			});
		})
		.all("/", (req, res, next) => {
			const uid = requireUid(req, res);
			const path = `/users/${uid}`;
			return documentCrud(path)(req, res, next);
		});

	// ** Encryption Keys
	dbRouter.all("/keys/main", (req, res, next) => {
		const uid = requireUid(req, res);
		const path = `/users/${uid}/keys/main`;
		return documentCrud(path)(req, res, next);
	});

	// ** Accounts
	dbRouter
		.connect("/accounts", (req, res) => {
			res.json({ message: "TODO: Watch the user's encrypted account docs" });
		})
		.get("/accounts", (req, res) => {
			res.json({ message: "TODO: Get the user's encrypted account docs" });
		})
		.get("/accounts/:accountId", (req, res) => {
			res.json({ message: "TODO: Get an encrypted account doc" });
		})
		.post("/accounts/:accountId", (req, res) => {
			res.json({ message: "TODO: Set an encrypted account doc" });
		})
		.delete("/accounts/:accountId", (req, res) => {
			res.json({ message: "TODO: Delete an encrypted account doc" });
		});

	// ** Transactions
	dbRouter
		.connect("/accounts/:accountId/transactions", (req, res) => {
			res.json({ message: "TODO: Watch the account's encrypted transaction docs" });
		})
		.get("/accounts/:accountId/transactions", (req, res) => {
			res.json({ message: "TODO: Get the account's encrypted transaction docs" });
		})
		.get("/accounts/:accountId/transactions/:transactionId", (req, res) => {
			res.json({ message: "TODO: Get an encrypted transaction doc" });
		})
		.post("/accounts/:accountId/transactions/:transactionId", (req, res) => {
			res.json({ message: "TODO: Set an encrypted transaction doc" });
		})
		.delete("/accounts/:accountId/transactions/:transactionId", (req, res) => {
			res.json({ message: "TODO: Delete an encrypted transaction doc" });
		});

	// ** Locations
	dbRouter
		.connect("/locations", (req, res) => {
			res.json({ message: "TODO: Watch the user's encrypted location docs" });
		})
		.get("/locations", (req, res) => {
			res.json({ message: "TODO: Get the user's encrypted location docs" });
		})
		.get("/locations/:locationId", (req, res) => {
			res.json({ message: "TODO: Get an encrypted location doc" });
		})
		.post("/locations/:locationId", (req, res) => {
			res.json({ message: "TODO: Set an encrypted location doc" });
		})
		.delete("/locations/:locationId", (req, res) => {
			res.json({ message: "TODO: Delete an encrypted location doc" });
		});

	// ** Tags
	dbRouter
		.connect("/tags", (req, res) => {
			res.json({ message: "TODO: Watch the user's encrypted tag dogs" });
		})
		.get("/tags", (req, res) => {
			res.json({ message: "TODO: Get the user's encrypted tag docs" });
		})
		.get("/tags/:tagId", (req, res) => {
			res.json({ message: "TODO: Get an encrypted tag doc" });
		})
		.post("/tags/:tagId", (req, res) => {
			res.json({ message: "TODO: Set an encrypted tag doc" });
		})
		.delete("/tags/:tagId", (req, res) => {
			res.json({ message: "TODO: Delete an encrypted tag doc" });
		});

	// ** Attachments
	dbRouter
		.connect("/attachments", (req, res) => {
			res.json({ message: "TODO: Watch the user's encrypted attachment docs" });
		})
		.get("/attachments", (req, res) => {
			res.json({ message: "TODO: Get the user's encrypted attachment docs" });
		})
		.get("/attachments/:attachmentId", (req, res) => {
			res.json({ message: "TODO: Get an encrypted attachment doc" });
		})
		.post("/attachments/:attachmentId", (req, res) => {
			res.json({ message: "TODO: Set an encrypted attachment doc" });
		})
		.delete("/attachments/:attachmentId", (req, res) => {
			res.json({ message: "TODO: Delete an encrypted tag doc" });
		});

	return dbRouter;
}
