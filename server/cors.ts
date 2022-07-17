import type { CorsOptions } from "cors";
import { env } from "./environment.js";
import { OriginError } from "./errors/index.js";
import { URL } from "url";
import _cors from "cors";

const allowedOriginHostnames = new Set<string>();

// Add typical localhost variants
allowedOriginHostnames.add("localhost");
allowedOriginHostnames.add("127.0.0.1");
allowedOriginHostnames.add("::1");

// Add configured host to list of allowed origins
const configuredHostUrl = env("HOST") ?? null;
if (configuredHostUrl !== null) {
	try {
		const { hostname } = new URL(configuredHostUrl);
		allowedOriginHostnames.add(hostname);
	} catch {
		process.stderr.write(`Value for env key HOST is not a valid URL: '${configuredHostUrl}'/n`);
	}
}

process.stdout.write(
	`allowedOriginHostnames: ${JSON.stringify(Array.from(allowedOriginHostnames))}\n`
);

const corsOptions: CorsOptions = {
	credentials: true,
	origin: (origin, callback) => {
		// Allow requests with no origin (mobile apps, curl, etc.)
		if (origin === undefined || !origin) {
			process.stdout.write(`Handling request that has no origin\n`);
			return callback(null, true);
		}

		// Guard Origin
		try {
			const { hostname } = new URL(origin);

			if (!allowedOriginHostnames.has(hostname)) {
				process.stdout.write(
					`Blocking request from origin: ${origin} (inferred hostname: ${hostname})\n`
				);
				return callback(new OriginError(), false);
			}
		} catch {
			process.stdout.write(
				`Blocking request from origin: ${origin} (inferred hostname: <invalid-url>)\n`
			);
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
