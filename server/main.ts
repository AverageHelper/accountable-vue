import "source-map-support/register.js";
import { auth } from "./auth/index.js";
import { cors } from "./cors.js";
import { db } from "./db.js";
import { env } from "./environment.js";
import { handleErrors } from "./handleErrors.js";
import { lol } from "./lol.js";
import { ping } from "./ping.js";
import { version } from "./version.js";
import express from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import methodOverride from "method-override";

const port = 40850;

const app = express();
expressWs(app); // Set up websocket support. This is the reason our endpoint declarations need to be functions and not `const` declarations

app
	.use(methodOverride())
	.use(helmet())
	.use(cors())
	.get("/v0/", lol)
	.get("/v0/ping", ping)
	.get("/v0/version", (req, res) => res.json({ message: `Accountable v${version}`, version }))
	.use(express.json({ limit: "5mb" }))
	.use(express.urlencoded({ limit: "5mb", extended: true }))
	.use("/v0/", auth()) // Auth endpoints
	.use("/v0/db", db()) // Database endpoints (checks auth)
	.use(handleErrors);

process.stdout.write(`NODE_ENV: ${env("NODE_ENV") ?? "undefined"}\n`);

app.listen(port, () => {
	process.stdout.write(`Accountable storage server listening on port ${port}\n`);
});
