import type { DocumentData } from "../database/schemas.js";
import type { Request, Response } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { close, createWriteStream, open } from "fs";
import { resolve as resolvePath, sep as pathSeparator, join } from "path";
import { stat as fsStat, unlink as fsUnlink, readFile, utimes } from "fs/promises";
import { handleErrors } from "../handleErrors.js";
import { ownersOnly, requireAuth } from "../auth/index.js";
import { Router } from "express";
import { DB_DIR, ensure, statsForUser } from "../database/io.js";
import { useJobQueue } from "@averagehelper/job-queue";
import {
	BadRequestError,
	InternalError,
	NotFoundError,
	respondData,
	respondError,
	respondSuccess,
} from "../responses.js";

interface Params {
	uid?: string;
	fileName?: string;
}

interface WriteAction {
	method: "post" | "delete";
	path: string;
	req: Request<Params>;
	res: Response;
	uid: string;
}

/**
 * Runs a basic `touch` on the given file.
 * @see https://remarkablemark.org/blog/2017/12/17/touch-file-nodejs/
 *
 * @param filename The path to the file to touch.
 */
async function touch(filename: string): Promise<void> {
	const time = new Date();

	try {
		// Update the file's timestamps
		await utimes(filename, time, time);
	} catch {
		// On fail, open and close the file again
		// This normally happens when the file does not exist yet.
		// These blocks create the file
		const fd = await new Promise<number>((resolve, reject) => {
			open(filename, "w", (err, fd) => {
				if (err) return reject(err);
				resolve(fd);
			});
		});
		await new Promise<void>((resolve, reject) => {
			close(fd, err => {
				if (err) return reject(err);
				resolve();
			});
		});
	}
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
	console.debug("handleWrite", job.method, job.path);

	try {
		switch (job.method) {
			case "post": {
				// If the file already exists, delete it first
				console.debug("Checking if file exists...");
				const exists = await fileExists(job.path);
				if (exists) {
					console.debug("File exists. Unlinking");
					await fsUnlink(job.path);
				} else {
					console.debug("File does not exist yet");
				}
				await touch(job.path);

				// TODO: Check that the user has room to do writes

				// Do the write
				await new Promise<void>(resolve => {
					console.debug("Setting up file pipes...");
					// See https://medium.com/@vecera.petr/how-to-handle-large-file-upload-with-nodejs-express-server-7de9ab3f7af1
					const req = job.req;
					req.busboy.on("file", (fieldName, file, fileInfo) => {
						console.debug(`Upload of '${fileInfo.filename}' started`);

						// Create a write stream of the new file
						const fstream = createWriteStream(job.path, { encoding: "utf-8" });
						file.pipe(fstream); // pipe it through

						// On finish
						fstream.on("close", () => {
							console.debug(`Upload of '${fileInfo.filename}' finished`);
							resolve();
						});
					});
					req.busboy.on("close", () => {
						console.debug("Closing busboy");
						resolve();
					});
					console.debug("Registered busboy events and piping");
					req.pipe(req.busboy); // Pipe the data through busboy
				});
				break;
			}
			case "delete": {
				await fsUnlink(job.path);
				break;
			}
		}
	} catch (error: unknown) {
		console.error(error);
		return respondError(job.res, new InternalError());
	}

	// When done, get back to the caller
	const { totalSpace, usedSpace } = await statsForUser(job.uid);
	respondSuccess(job.res, { totalSpace, usedSpace });
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

async function getFileContents(path: string): Promise<string> {
	try {
		return await readFile(path, { encoding: "utf-8" });
	} catch (error: unknown) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			throw new NotFoundError();
		}
		throw error;
	}
}

/**
 * Returns a filesystem path for the given file params,
 * or `null` if unsufficient or invalid params were provided.
 */
async function filePath(params: Params): Promise<string | null> {
	const { uid, fileName } = params;
	if (uid === undefined || fileName === undefined) return null;

	// Make sure fileName doesn't contain a path separator
	if (fileName.includes(pathSeparator)) return null;

	// TODO: Make sure uid is a valid uid, so we don't let in stray path arguments there

	const folder = resolvePath(DB_DIR, `./users/${uid}/attachments`);
	await ensure(folder);
	return join(folder, fileName);
}

interface FileData {
	contents: string;
	_id: string;
}

export function storage(this: void): Router {
	return Router()
		.use(requireAuth()) // require auth from here on in
		.use("/users/:uid", ownersOnly())
		.get<Params>(
			"/users/:uid/attachments/:fileName",
			asyncWrapper(async (req, res) => {
				const path = await filePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				const contents = await getFileContents(path);
				const fileData: DocumentData<FileData> = {
					contents,
					_id: req.params.fileName ?? "unknown",
				};
				respondData(res, fileData);
			})
		)
		.post<Params>(
			"/users/:uid/attachments/:fileName",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const path = await filePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				const queue = useJobQueue<WriteAction>(path);
				queue.process(handleWrite);
				queue.createJob({ method: "post", path, req, res, uid });
			})
		)
		.delete<Params>(
			"/users/:uid/attachments/:fileName",
			asyncWrapper(async (req, res) => {
				const uid = (req.params.uid ?? "") || null;
				if (uid === null) throw new NotFoundError();

				const path = await filePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				const queue = useJobQueue<WriteAction>(path);
				queue.process(handleWrite);
				queue.createJob({ method: "delete", path, req, res, uid });
			})
		)
		.use(handleErrors);
}
