import { check } from "diskusage";
import { platform } from "os";
import { simplifiedByteCount } from "../transformers/index.js";

const rootPath = platform() === "win32" ? "c:" : "/";

async function availableSpace(): Promise<number> {
	const { available } = await check(rootPath);
	return available;
}

const defaultMaxUsers = 5;
export const MAX_USERS = Number.parseInt(process.env["MAX_USERS"] ?? `${defaultMaxUsers}`, 10);

// Check disk capacity
const totalSpace = await availableSpace();
export const spacePerUser = totalSpace / MAX_USERS;

console.log(
	`System has ${simplifiedByteCount(totalSpace)} available. That's ${simplifiedByteCount(
		spacePerUser
	)} for each of our ${MAX_USERS} max users.`
);

// TODO: Divide the disk space among a theoretical capacity of users
// No one user may occupy more space than that max
