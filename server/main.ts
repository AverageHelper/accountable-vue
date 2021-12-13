import "source-map-support/register.js";
import "./environment.js";
import { auth, requireAuth } from "./auth/index.js";
import { db } from "./db.js";
import { lol } from "./lol.js";
import { storage } from "./storage.js";
import cors from "cors";
// import csrf from "csurf"; // TODO: look into this
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
	.get("/", lol) // TODO: maybe we should serve the app here? idk
	.use(auth())
	.use(requireAuth()) // require auth from here on in
	.use("/db", db())
	.use("/files", storage());

app.listen(port, () => {
	process.stdout.write(`Accountable storage server listening on port ${port}\n`);
});
