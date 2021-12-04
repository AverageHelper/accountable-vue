import "source-map-support/register.js";
import "./environment.js";
import { auth, requireAuth } from "./auth.js";
import { db } from "./db.js";
import { lol } from "./lol.js";
import cors from "cors";
// import csrf from "csurf"; // look into this
import express from "express";
import formidable from "formidable";
import helmet from "helmet";
import methodOverride from "method-override";

const port = 40850;

const app = express()
	.use(methodOverride())
	.use(helmet())
	.use(cors())
	.use(express.json())
	.use(express.urlencoded({ extended: true }))
	.get("/", lol) // maybe we should serve the app here? idk
	.use(auth)
	.use(requireAuth)
	.use("/db", db);

// Blob data storage
//   GET path -> get file
//   PUT path data -> store file
//   DELETE path -> delete file
app
	.get("/files", (req, res) => {
		res.json({ message: "This will return the file at the path." });
	})
	.put("/files", (req, res, next) => {
		formidable({ multiples: true }).parse(req, (error, fields, files) => {
			if (error) {
				next(error);
				return;
			}
			res.json({ fields, files });
		});
	})
	.delete("/files", (req, res) => {
		res.json({ message: "This will delete the file at the path." });
	});

app.listen(port, () => {
	process.stdout.write(`Accountable storage server listening on port ${port}\n`);
});
