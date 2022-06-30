import type { DocumentData } from "../database/schemas.js";
import type { Request, Response } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { createWriteStream } from "fs";
import { handleErrors } from "../handleErrors.js";
import { maxSpacePerUser } from "../auth/limits.js";
import { ownersOnly, requireAuth } from "../auth/index.js";
import { respondData, respondError, respondSuccess } from "../responses.js";
import { Router } from "express";
import { sanitizedFilePath } from "./sanitizedFilePath.js";
import { stat as fsStat, unlink as fsUnlink, readFile } from "fs/promises";
import { statsForUser } from "../database/io.js";
import { simplifiedByteCount } from "../transformers/simplifiedByteCount.js";
import { touch } from "../database/filesystem.js";
import { useJobQueue } from "@averagehelper/job-queue";
import meter from "stream-meter";
import {
	BadRequestError,
	InternalError,
	NotEnoughRoomError,
	NotFoundError,
} from "../errors/index.js";

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

async function fsWrite(
	job: WriteAction,
	maxSizeOfUserFolder: number,
	sizeOfUserFolder: number
): Promise<void> {
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

	// Is user out of room?
	const remainingSpace = maxSizeOfUserFolder - sizeOfUserFolder;
	if (remainingSpace <= 0) throw new NotEnoughRoomError();

	// Do the write
	// TODO: Stream the file into a staging area to move after a successful upload
	// This way, if something goes wrong, the important user data is safe
	await new Promise<void>((resolve, reject) => {
		console.debug("Setting up file pipes...");
		// See https://medium.com/@vecera.petr/how-to-handle-large-file-upload-with-nodejs-express-server-7de9ab3f7af1
		const req = job.req;

		req.busboy.on("file", (fieldName, file, fileInfo) => {
			console.debug(`Upload of '${fileInfo.filename}' started`);

			// Create a write stream of the new file
			const sizeMeter = meter(remainingSpace); // keeps the size below max
			const fstream = createWriteStream(job.path, { encoding: "utf-8" });
			file.pipe(sizeMeter).pipe(fstream); // pipe it through

			// If the user exteeded their max size, abort
			sizeMeter.on("error", error => {
				console.error(error);
				// Clean up
				// TODO: Delete new file from the staging area, don't place it
				reject(new NotEnoughRoomError());
			});

			// On finish
			fstream.on("close", () => {
				console.debug(`Upload of '${fileInfo.filename}' finished`);
				// TODO: Copy file from staging area onto the real path
				resolve();
			});
		});

		req.busboy.on("close", () => {
			console.debug("Closing busboy");
			resolve();
		});

		// Set the ball rolling
		console.debug("Registered busboy events and piping");
		req.pipe(req.busboy);
	});
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

	const {
		totalSpace: maxSizeOfUserFolder, //
		usedSpace: sizeOfUserFolder,
	} = await statsForUser(job.uid);

	const userSizeDesc = simplifiedByteCount(sizeOfUserFolder);
	const maxSpacDesc = simplifiedByteCount(maxSpacePerUser);
	console.debug(`User ${job.uid} has used ${userSizeDesc} of ${maxSpacDesc}`);

	try {
		switch (job.method) {
			case "post":
				await fsWrite(job, maxSizeOfUserFolder, sizeOfUserFolder);
				break;
			case "delete": {
				await fsUnlink(job.path);
				break;
			}
		}
	} catch (error) {
		if (error instanceof InternalError) {
			return respondError(job.res, error);
		}
		console.error(`Unknown error`, error);
		return respondError(job.res, new InternalError());
	}

	// When done, get back to the caller with new stats
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
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

async function getFileContents(path: string): Promise<string> {
	try {
		return await readFile(path, { encoding: "utf-8" });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			throw new NotFoundError();
		}
		throw error;
	}
}

interface FileData {
	contents: string;
	_id: string;
}

export function storage(this: void): Router {
	return Router()
		.use(requireAuth) // require auth from here on in
		.use("/users/:uid", ownersOnly)
		.get<Params>(
			"/users/:uid/attachments/:fileName",
			asyncWrapper(async (req, res) => {
				const path = await sanitizedFilePath(req.params);
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

				const path = await sanitizedFilePath(req.params);
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

				const path = await sanitizedFilePath(req.params);
				if (path === null)
					throw new BadRequestError("Your UID or that file name don't add up to a valid path");

				const queue = useJobQueue<WriteAction>(path);
				queue.process(handleWrite);
				queue.createJob({ method: "delete", path, req, res, uid });
			})
		)
		.use(handleErrors);
}
