import type { CorsOptions } from "cors";
import { OriginError } from "./responses.js";
import _cors from "cors";

const allowedOrigins = new Set(["http://localhost:3000"]);

// Add configured host to list of allowed origins
const host = process.env["HOST"];
if (host !== undefined) allowedOrigins.add(host);
process.stdout.write(`allowedOrigins: ${JSON.stringify(Array.from(allowedOrigins.values()))}\n`);

const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		process.stdout.write(`Handling request from origin: ${origin ?? "undefined"}\n`);

		// Allow requests with no origin (mobile apps, curl, etc.)
		if (origin === undefined || !origin) return callback(null, true);

		// Guard Origin
		if (!allowedOrigins.has(origin)) {
			return callback(new OriginError(), false);
		}

		// Origin must be OK! Let 'em in
		return callback(null, true);
	},
};

export function cors(): ReturnType<typeof _cors> {
	return _cors(corsOptions);
}
