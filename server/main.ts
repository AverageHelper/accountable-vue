import "source-map-support/register.js";
import { auth } from "./auth/index.js";
import { cors } from "./cors.js";
import { db } from "./db.js";
import { env } from "./environment.js";
import { handleErrors } from "./handleErrors.js";
import { lol } from "./lol.js";
import { ping } from "./ping.js";
import { serverVersion } from "./serverVersion.js";
import { storage } from "./storage/index.js";
import busboy from "connect-busboy";
import express from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import methodOverride from "method-override";

const API_VERSION = 0;
const PORT = 40850;

const app = express();
expressWs(app); // Set up websocket support. This is the reason our endpoint declarations need to be functions and not `const` declarations

app
	.use(methodOverride())
	.use(helmet())
	.use(cors())
	.get(`/v${API_VERSION}/`, lol)
	.get(`/v${API_VERSION}/ping`, ping)
	.get(`/v${API_VERSION}/version`, serverVersion)
	.use(
		busboy({
			highWaterMark: 2 * 1024 * 1024, // 2 MiB buffer
		})
	)
	.use(`/v${API_VERSION}/files`, storage()) // Storage endpoints (checks auth)
	.use(express.json({ limit: "5mb" }))
	.use(express.urlencoded({ limit: "5mb", extended: true }))
	.use(`/v${API_VERSION}/`, auth()) // Auth endpoints
	.use(`/v${API_VERSION}/db`, db()) // Database endpoints (checks auth)
	.use(handleErrors);

process.stdout.write(`NODE_ENV: ${env("NODE_ENV") ?? "undefined"}\n`);

app.listen(PORT, () => {
	process.stdout.write(`Accountable storage server listening on port ${PORT}\n`);
});
