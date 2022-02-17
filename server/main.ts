import "source-map-support/register.js";
import "./environment.js";
import { auth } from "./auth/index.js";
import { cors } from "./cors.js";
import { db } from "./db.js";
import { handleErrors } from "./handleErrors.js";
import { lol } from "./lol.js";
import { storage } from "./storage/index.js";
import busboy from "connect-busboy";
import express from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import methodOverride from "method-override";

const port = 40850;

const app = express();
expressWs(app); // Set up websocket support

app
	.use(methodOverride())
	.use(helmet())
	.use(cors())
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
