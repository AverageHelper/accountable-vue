import type { RateLimiterRes } from "rate-limiter-flexible";
import { InternalError } from "./InternalError.js";

export class ThrottledError extends InternalError {
	constructor(rateLimiterRes: RateLimiterRes) {
		const headers = new Map<string, string | number | ReadonlyArray<string>>([
			["Retry-After", rateLimiterRes.msBeforeNext / 1000],
		]);
		super({
			status: 429,
			code: "too-many-requests",
			message: "You are being throttled",
			headers,
		});
		this.name = "ThrottledError";
	}
}
