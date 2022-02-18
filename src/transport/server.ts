import type { AccountableDB } from "./db";
import { getFrom, UnexpectedResponseError } from "./networking";

/**
 * Asks the database server what its current version is.
 *
 * @returns The server's reported version string.
 */
export async function getServerVersion(db: AccountableDB): Promise<string> {
	const version = new URL("version", db.url);
	const response = await getFrom(version);
	if (response.version === undefined || !response.version)
		throw new UnexpectedResponseError("No version string found");

	return response.version;
}
