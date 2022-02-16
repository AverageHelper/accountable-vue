import "source-map-support/register.js";
import "./environment.js";
import { auth } from "./auth/index.js";
import { db } from "./db.js";
import { handleErrors } from "./handleErrors.js";
import { lol } from "./lol.js";
import { storage } from "./storage/index.js";
import busboy from "connect-busboy";
import cors from "cors";
import express from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import methodOverride from "method-override";

const port = 40850;

const app = express();
expressWs(app); // Set up websocket support

const allowedOrigins = new Set(["http://localhost:3000"]);
const host = process.env["HOST"]; // TODO: Document this
if (host !== undefined) {
	allowedOrigins.add(host);
}

app
	.use(methodOverride())
	.use(helmet())
	.use(
		cors({
			origin: (origin, callback) => {
				// Allow requests with no origin
				// (mobile apps, curl, etc.)
				if (origin === undefined || !origin) return callback(null, true);

				if (!allowedOrigins.has(origin)) {
					const message =
						"The CORS policy for this site does not allow access from the specified Origin.";
					return callback(new Error(message), false);
				}

				return callback(null, true);
			},
		})
	)
	.use(
		busboy({
			highWaterMark: 2 * 1024 * 1024, // 2 MiB buffer
		})
	)
	.use("/files", storage())
	.use(express.json({ limit: "5mb" }))
	.use(express.urlencoded({ limit: "5mb", extended: true }))
	.get("/", lol)
	.use(auth())
	.use("/db", db())
	.use(handleErrors);

process.stdout.write(`NODE_ENV: ${process.env.NODE_ENV}\n`);

app.listen(port, () => {
	process.stdout.write(`Accountable storage server listening on port ${port}\n`);
});
