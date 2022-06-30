import { DB_DIR, ensure } from "../database/io.js";
import { resolve as resolvePath, sep as pathSeparator, join } from "path";

interface Params {
	uid?: string;
	fileName?: string;
}

/**
 * Returns a filesystem path for the given file params,
 * or `null` if unsufficient or invalid params were provided.
 */
export async function sanitizedFilePath(params: Params): Promise<string | null> {
	const { uid, fileName } = params;
	if (uid === undefined || fileName === undefined || !uid.trim() || !fileName.trim()) return null;

	// Make sure fileName doesn't contain a path separator
	if (fileName.includes("..") || fileName.includes(pathSeparator)) return null;

	// Make sure uid doesn't contain stray path arguments
	if (uid.includes("..") || uid.includes(pathSeparator)) return null;

	const folder = resolvePath(DB_DIR, `./users/${uid.trim()}/attachments`);

	const path = join(folder, fileName.trim());
	if (path.includes("..")) {
		console.error(`Someone might be trying a path traversal with '${path}'`);
		return null;
	}

	await ensure(folder); // make sure the folder exists
	return path;
}
