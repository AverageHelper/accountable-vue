import { Router } from "express";
import formidable from "formidable";

// Blob data storage
//   GET path -> get file
//   POST path data -> store file
//   DELETE path -> delete file

// TODO: Filesystem hooks I guess

export function storage(this: void): Router {
	return Router()
		.get("/files", (req, res) => {
			res.json({ message: "This will return the file at the path." });
		})
		.put("/files", (req, res, next) => {
			formidable({ multiples: true }).parse(req, (error, fields, files) => {
				// eslint-disable-next-line no-extra-boolean-cast
				if (Boolean(error)) {
					next(error);
					return;
				}
				res.json({ fields, files });
			});
		})
		.delete("/files", (req, res) => {
			res.json({ message: "This will delete the file at the path." });
		});
}
