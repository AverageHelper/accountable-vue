import { check } from "diskusage";
import { platform } from "os";

const rootPath = platform() === "win32" ? "c:" : "/";

async function availableSpace(): Promise<number> {
	const { available } = await check(rootPath);
	return available;
}

function fileSizeStringFromByteCount(num: number): string {
	if (typeof num !== "number" || Number.isNaN(num)) {
		throw new TypeError("Expected a number");
	}

	const neg = num < 0;
	const units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	if (neg) {
		num = -num;
	}

	if (num < 1) {
		return `${neg ? "-" : ""}${num} B`;
	}

	const exponent: number = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
	const unit: string = units[exponent] ?? "";
	const size: string = (num / 1000 ** exponent).toFixed(2);

	return `${neg ? "-" : ""}${size} ${unit}`;
}

const defaultMaxUsers = 5;
export const MAX_USERS = Number.parseInt(process.env["MAX_USERS"] ?? `${defaultMaxUsers}`, 10);

// Check disk capacity
const totalSpace = await availableSpace();
export const spacePerUser = totalSpace / MAX_USERS;

console.log(
	`System has ${fileSizeStringFromByteCount(
		totalSpace
	)} available. That's ${fileSizeStringFromByteCount(
		spacePerUser
	)} for each of our ${MAX_USERS} max users.`
);

// TODO: Divide the disk space among a theoretical capacity of users
// No one user may occupy more space than that max
