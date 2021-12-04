import type { DataItem } from "./database/index.js";
import type { Request, Response } from "express";
import type WebSocket from "ws";
import { asyncWrapper } from "./asyncWrapper.js";
import { ownersOnly } from "./auth.js";
import { Router } from "express";
import { deleteDataItemAtPath, getDataItemAtPath, setDataItemAtPath } from "./database/index.js";

// Database data storage
//   WS path -> open websocket to watch a document or a series of documents on a database path
//   GET path -> get data in JSON format
//   POST path data -> database set
//   DELETE path -> database delete

function respondNotSignedIn(this: void, req: Request, res: Response): void {
	res.status(403).json({ message: "You must sign in first" });
}

function respondNotFound(this: void, req: Request, res: Response): void {
	res.status(404).json({ message: "No data found" });
}

function respondInternalError(this: void, req: Request, res: Response): void {
	res.status(500).json({ message: "Not sure what went wrong. Try again maybe?" });
}

function _requireUid(this: void, req: Request, respondIfNoUid: () => void): string {
	// ownersOnly garantees that there is an auth.uid on the session. Throw if this is not the case.
	const uid = req.session.context?.auth?.uid ?? null;
	if (uid === null) {
		respondIfNoUid();
		// Force-stop if the UID is not found
		throw new TypeError(
			"No UID found on session. Make sure to use `ownersOnly` before reaching this point."
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

// See https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/

export function db(this: void): Router {
	const dbRouter = Router().all("/users/:uid/*", ownersOnly);

	// ** User Preferences
	dbRouter
		.ws("/", (ws, req) => {
			ws.on("message", msg => {
				try {
					const uid = requireUidWs(req, ws);
					console.log(`User '${uid}' sent message: '${JSON.stringify(msg.valueOf())}'`);
					ws.send(JSON.stringify({ message: "TODO: Watch the user's encrypted preference doc" }));
				} catch (error: unknown) {
					console.error(error);
				}
			});
		})
		.get(
			"/",
			asyncWrapper(async (req, res) => {
				try {
					const uid = requireUid(req, res);
					const data = await getDataItemAtPath(`/users/${uid}`);
					if (data === null) {
						return respondNotFound(req, res);
					}
					res.json(data);
				} catch (error: unknown) {
					console.error(error);
					respondInternalError(req, res);
				}
			})
		)
		.post(
			"/",
			asyncWrapper(async (req, res) => {
				try {
					const uid = requireUid(req, res);
					await setDataItemAtPath(`/users/${uid}`, req.body as DataItem);
					res.json({ message: "TODO: Set the user's encrypted preference doc" });
				} catch (error: unknown) {
					console.error(error);
					respondInternalError(req, res);
				}
			})
		)
		.delete(
			"/",
			asyncWrapper(async (req, res) => {
				try {
					const uid = requireUid(req, res);
					await deleteDataItemAtPath(`/users/${uid}`);
					res.json({ message: "Success!" });
				} catch (error: unknown) {
					console.error(error);
					respondInternalError(req, res);
				}
			})
		);

	// ** Encryption Keys
	dbRouter
		.get("/keys/main", (req, res) => {
			res.json({ message: "TODO: Get the user's encrypted encryption key" });
		})
		.post("/keys/main", (req, res) => {
			res.json({ message: "TODO: Set the user's encrypted encryption key" });
		})
		.delete("/keys/main", (req, res) => {
			res.json({ message: "TODO: Delete the user's encrypted encryption key" });
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
