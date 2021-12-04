import type { Request, Response } from "express";
import { getDataItemAtPath } from "./storage/db.js";
import { ownersOnly } from "./auth.js";
import { Router } from "express";

// Database data storage
//   CONNECT path -> open websocket to watch a document or a series of documents on a database path
//   GET path -> get data in JSON format
//   POST path data -> database set
//   DELETE path -> database delete

// See https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/

const dbRouter = Router().all("/users/:uid/*", ownersOnly);

function respondNotFound(this: void, req: Request, res: Response): void {
	res.status(404).json({ message: "No data found" });
}

function respondNotSignedIn(this: void, req: Request, res: Response): void {
	res.status(403).json({ message: "You must sign in first" });
}

function requireUid(this: void, req: Request, res: Response): string {
	// ownersOnly garantees that there is an auth.uid on the session
	const uid = req.session.context?.auth?.uid ?? null;
	if (uid === null) {
		// Force-stop if the UID is not found
		respondNotSignedIn(req, res);
		throw new TypeError(
			"No UID found on session. Make sure to use `ownersOnly` before reaching this point."
		);
	}
	return uid;
}

// ** User Preferences
dbRouter
	.connect("/", (req, res) => {
		res.json({ message: "TODO: Watch the user's encrypted preference doc" });
	})
	.get("/", async (req, res) => {
		const uid = requireUid(req, res);
		const data = await getDataItemAtPath(`/users/${uid}`);
		if (data === null) {
			return respondNotFound(req, res);
		}
		res.json({ message: "TODO: Get the user's encrypted preference doc" });
	})
	.post("/", (req, res) => {
		res.json({ message: "TODO: Set the user's encrypted preference doc" });
	})
	.delete("/", (req, res) => {
		res.json({ message: "TODO: Delete the user's encrypted preference doc" });
	});

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

export { dbRouter as db };
