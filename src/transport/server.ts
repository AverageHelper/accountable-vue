import type { AccountableDB } from "./db";
import { getFrom, version } from "./api-types/index.js";
import { UnexpectedResponseError } from "./errors/index.js";

/**
 * Asks the database server what its current version is.
 *
 * @returns The server's reported version string.
 */
export async function getServerVersion(db: AccountableDB): Promise<string> {
	const response = await getFrom(new URL(version(), db.url));
	if (response.version === undefined || !response.version)
		throw new UnexpectedResponseError("No version string found");

	return response.version;
}
