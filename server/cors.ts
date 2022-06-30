import type { CorsOptions } from "cors";
import { OriginError } from "./errors/index.js";
import { requireEnv } from "./environment.js";
import _cors from "cors";

const allowedOrigins = new Set(["http://localhost:3000"]);

// Add configured host to list of allowed origins
try {
	const host = requireEnv("HOST");
	allowedOrigins.add(host);
} catch {} // nop

process.stdout.write(`allowedOrigins: ${JSON.stringify(Array.from(allowedOrigins.values()))}\n`);

const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (mobile apps, curl, etc.)
		if (origin === undefined || !origin) {
			process.stdout.write(`Handling request that has no origin\n`);
			return callback(null, true);
		}

		// Guard Origin
		if (!allowedOrigins.has(origin)) {
			process.stdout.write(`Blocking request from origin: ${origin}\n`);
			return callback(new OriginError(), false);
		}

		// Origin must be OK! Let 'em in
		process.stdout.write(`Handling request from origin: ${origin}\n`);
		return callback(null, true);
	},
};

export function cors(): ReturnType<typeof _cors> {
	return _cors(corsOptions);
}
