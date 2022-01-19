import "source-map-support/register.js";
import "./environment.js";
import { auth, requireAuth } from "./auth/index.js";
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

app
	.use(methodOverride())
	.use(helmet())
	.use(cors())
	.use(express.json())
	.use(express.urlencoded({ extended: true }))
	.use(
		busboy({
			highWaterMark: 2 * 1024 * 1024, // 2 MiB buffer
		})
	)
	.get("/", lol)
	.use(auth())
	.use("/db", db())
	.use(requireAuth()) // require auth from here on in
	.use("/files", storage())
	.use(handleErrors);

process.stdout.write(`NODE_ENV: ${process.env.NODE_ENV}\n`);

app.listen(port, () => {
	process.stdout.write(`Accountable storage server listening on port ${port}\n`);
});
