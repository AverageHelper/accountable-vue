import type { Request, Response } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { createWriteStream } from "fs";
import { stat as fsStat, unlink as fsUnlink } from "fs/promises";
import { handleErrors } from "../handleErrors.js";
import { BadRequestError, NotFoundError, respondSuccess } from "../responses.js";
import { ownersOnly } from "../auth/index.js";
import { resolve as resolvePath, sep as pathSeparator } from "path";
import { Router } from "express";
import { useJobQueue } from "@averagehelper/job-queue";

interface Params {
	uid?: string;
	fileName?: string;
}

interface WriteAction {
	method: "post" | "delete";
	path: string;
	req: Request<Params>;
	res: Response;
}

/**
 * Performs the given filesystem action.
 *
 * This function executes asynchronously, but **must not** operate
 * concurrently on the same filesystem path.
 *
 * {@link useJobQueue} may be used to garantee that each instance
 * of this function for a given file path runs its course before
 * starting the next job. This should prevent race conditions against
 * filesystem objects.
 */
async function handleWrite(job: WriteAction): Promise<void> {
	switch (job.method) {
		case "post": {
			// If the file already exists, delete it first
			const exists = await fileExists(job.path);
			if (exists) {
				await fsUnlink(job.path);
			}

			// Do the write
			await new Promise<void>(resolve => {
				// See https://medium.com/@vecera.petr/how-to-handle-large-file-upload-with-nodejs-express-server-7de9ab3f7af1
				const req = job.req;
				req.pipe(req.busboy); // Pipe the data through busboy
				req.busboy.on("file", (fieldName, file, fileInfo) => {
					console.log(`Upload of '${fileInfo.filename}' started`);

					// Create a write stream of the new file
					const fstream = createWriteStream(job.path);
					file.pipe(fstream); // pipe it through

					// On finish
					fstream.on("close", () => {
						console.log(`Upload of '${fileInfo.filename}' finished`);
						resolve();
					});
				});
			});
			break;
		}
		case "delete": {
			await fsUnlink(job.path);
			break;
		}
	}

	// When done, get back to the caller
	respondSuccess(job.res);
}

/**
 * Returns a `Promise` that resolves `true` if a file exists at
 * the given path, `false` otherwise.
 *
 * @see https://stackoverflow.com/a/17699926
 */
async function fileExists(path: string): Promise<boolean> {
	try {
		await fsStat(path);
		return true;
	} catch (error: unknown) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

/**
 * Returns a filesystem path for the given file params,
 * or `null` if unsufficient or invalid params were provided.
 */
function filePath(params: Params): string | null {
	const { uid, fileName } = params;
	if (uid === undefined || fileName === undefined) return null;

	// Make sure fileName doesn't contain a path separator
	if (fileName.includes(pathSeparator)) return null;

	// TODO: Make sure uid is a valid uid, so we don't let in stray path arguments there

	// TODO: Put this somewhere more standard. The source folder is probs not the best place...
	return resolvePath(__dirname, `./files/users/${uid}/attachments/${fileName}`);
}

const cacheControl = "no-store";

export function storage(this: void): Router {
	return Router()
		.use("/users/:uid", ownersOnly())
		.get<Params>(
			"/users/:uid/attachments/:fileName",
			asyncWrapper(async (req, res) => {
				const path = filePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				const exists = await fileExists(path);
				if (!exists) throw new NotFoundError();

				res
					.setHeader("Cache-Control", cacheControl)
					.setHeader("Vary", "*")
					.sendFile(path, { dotfiles: "deny" });
			})
		)
		.post<Params>("/users/:uid/attachments/:fileName", (req, res) => {
			const path = filePath(req.params);
			if (path === null)
				throw new BadRequestError("Your UID or that file name don't add up to a valid path");

			const queue = useJobQueue<WriteAction>(path);
			queue.process(handleWrite);
			queue.createJob({ method: "post", path, req, res });
		})
		.delete<Params>("/users/:uid/attachments/:fileName", (req, res) => {
			const path = filePath(req.params);
			if (path === null)
				throw new BadRequestError("Your UID or that file name don't add up to a valid path");

			const queue = useJobQueue<WriteAction>(path);
			queue.process(handleWrite);
			queue.createJob({ method: "delete", path, req, res });
		})
		.use(handleErrors);
}
