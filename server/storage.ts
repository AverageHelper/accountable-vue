import type { Response } from "express";
import { asyncWrapper } from "./asyncWrapper.js";
import { handleErrors } from "./handleErrors.js";
import { NotFoundError, respondSuccess } from "./responses.js";
import { ownersOnly } from "./auth/index.js";
import { resolve as resolvePath } from "path";
import { Router } from "express";
import { useJobQueue } from "@averagehelper/job-queue";
import formidable from "formidable";
import fs from "fs/promises";

interface Params {
	uid?: string;
	fileName?: string;
}

interface _WriteAction {
	path: string;
	res: Response;
}

interface PutAction extends _WriteAction {
	method: "put";
	files: formidable.Files;
}

interface DeleteAction extends _WriteAction {
	method: "delete";
}

type WriteAction = PutAction | DeleteAction;

// JobQueue should garantee that each instance of this function for a
// given file path runs its course before running the next one. This
// should prevent race conditions against filesystem objects.
async function handleWrite(job: WriteAction): Promise<void> {
	switch (job.method) {
		case "put": {
			const fileOrFiles = job.files[0] ?? [];
			let file: formidable.File | null;
			if (Array.isArray(fileOrFiles)) {
				file = fileOrFiles[0] ?? null;
			} else {
				file = fileOrFiles;
			}
			if (file === null) throw new NotFoundError();

			await fs.writeFile(job.path, file?.toString());
			break;
		}
		case "delete": {
			await fs.unlink(job.path);
			break;
		}
	}
	respondSuccess(job.res);
}

/** @see https://stackoverflow.com/a/17699926 */
async function fileExists(path: string): Promise<boolean> {
	try {
		await fs.stat(path);
		return true;
	} catch (error: unknown) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

function filePath(params: Params): string | null {
	const { uid, fileName } = params;
	if (uid === undefined || fileName === undefined) {
		return null;
	}
	return resolvePath(
		__dirname,
		`./storage/files/users/${uid ?? "uid"}/attachments/${fileName ?? "fileName"}`
	);
}

export function storage(this: void): Router {
	return Router()
		.use("/users/:uid", ownersOnly())
		.get<Params>(
			"/users/:uid/attachments/:fileName",
			asyncWrapper(async (req, res) => {
				const path = filePath(req.params);
				if (path === null) throw new NotFoundError();

				const exists = await fileExists(path);
				if (!exists) throw new NotFoundError();

				res.sendFile(path, { dotfiles: "deny" });
			})
		)
		.put<Params>("/users/:uid/attachments/:fileName", (req, res, next) => {
			formidable({ multiples: true }).parse(req, (error, fields, files) => {
				// eslint-disable-next-line no-extra-boolean-cast
				if (Boolean(error)) return next(error);

				const path = filePath(req.params);
				if (path === null) throw new NotFoundError();

				const queue = useJobQueue<WriteAction>(path);
				queue.process(handleWrite);
				queue.createJob({ method: "put", path, res, files });
			});
		})
		.delete<Params>("/users/:uid/attachments/:fileName", (req, res) => {
			const path = filePath(req.params);
			if (path === null) throw new NotFoundError();

			const queue = useJobQueue<WriteAction>(path);
			queue.process(handleWrite);
			queue.createJob({ method: "delete", path, res });
		})
		.use(handleErrors);
}
