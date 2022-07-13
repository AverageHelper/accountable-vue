import { close, open } from "fs";
import { NotFoundError } from "../errors/index.js";
import { mkdir, readFile, rename, stat, unlink, utimes } from "fs/promises";
import { tmpdir } from "os";

/** Removes the item at the given path from the filesystem. */
export async function deleteItem(path: string): Promise<void> {
	try {
		await unlink(path);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return; // not found means it's gone! :D
		}
		throw error;
	}
}

/** Ensures that a directory exists at the given path */
export async function ensure(path: string): Promise<void> {
	try {
		await mkdir(path, { recursive: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "EEXIST") {
			return; // already exists! :D
		}
		throw error;
	}
}

/**
 * Returns the operating system's default directory for temporary files as a string.
 */
export function tmpDir(): string {
	return tmpdir();
}

/**
 * Returns the operating system's default directory for temporary files as a string.
 */
export function tmpDir(): string {
	return tmpdir();
}

/**
 * Returns a `Promise` that resolves `true` if a file exists at
 * the given path, `false` otherwise.
 *
 * @see https://stackoverflow.com/a/17699926
 */
export async function fileExists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

/**
 * Retrieves the contents of the file at the given path.
 *
 * @param path The file path
 * @returns The contents of the file.
 */
export async function getFileContents(path: string): Promise<string> {
	try {
		return await readFile(path, { encoding: "utf-8" });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			console.warn(`No data found at path ${path}`);
			throw new NotFoundError();
		}
		throw error;
	}
}

/**
 * Moves the item from the source path to the destination.
 *
 * @param src The path to the file to move.
 * @param dest The file's new path.
 */
export async function moveFile(src: string, dest: string): Promise<void> {
	try {
		await deleteItem(dest);
		await rename(src, dest);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			throw new NotFoundError();
		}
		throw error;
	}
}

/**
 * Creates a file, or updates the timestamps of the existing file.
 * @see https://remarkablemark.org/blog/2017/12/17/touch-file-nodejs/
 *
 * @param filename The path to the file to touch.
 */
export async function touch(filename: string): Promise<void> {
	try {
		// Update the file's timestamps
		const time = new Date();
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
