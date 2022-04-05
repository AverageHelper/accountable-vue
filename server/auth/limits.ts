import { env } from "../environment.js";
import { promisify } from "util";
import { simplifiedByteCount } from "../transformers/index.js";
import fastFolderSize from "fast-folder-size";

const defaultMaxUsers = 5;
export const MAX_USERS = Number.parseInt(env("MAX_USERS") ?? `${defaultMaxUsers}`, 10);

// Check disk capacity
const defaultMaxSpace = 20000000000;
const totalSpace = Number.parseInt(env("MAX_BYTES") ?? `${defaultMaxSpace}`, 10);
export const maxSpacePerUser = totalSpace / MAX_USERS;

console.log(
	`We have ${simplifiedByteCount(totalSpace)} available. That's ${simplifiedByteCount(
		maxSpacePerUser
	)} for each of our ${MAX_USERS} max users.`
);

export const folderSize: (path: string) => Promise<number | undefined> = promisify(fastFolderSize);
