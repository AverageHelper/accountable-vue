import { close, open } from "fs";
import { utimes } from "fs/promises";

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
