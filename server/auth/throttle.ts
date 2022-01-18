import type { RateLimiterRes } from "rate-limiter-flexible";
import type { RequestHandler } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { ThrottledError } from "../responses.js";

const points = 10; // 10 tries
const duration = 10 * 60; // per 10 minutes
const blockDuration = 10 * 60; // block for 10 mins after points run out

// FIXME: We shouldn't use RateLimiterMemory in production
const rateLimiter = new RateLimiterMemory({ points, duration, blockDuration });

/**
 * Returns middleware that prevents an IP address from sending more than
 * 10 requests in 10 minutes.
 */
export function throttle<P = ParamsDictionary, ResBody = unknown, ReqBody = unknown>(
	this: void
): RequestHandler<P, ResBody, ReqBody> {
	return asyncWrapper(async (req, res, next) => {
		if (process.env.NODE_ENV === "development") {
			process.stdout.write("Ignoring throttle while in development mode\n");
			next();
			return;
		}
		const remoteIp = req.ip;
		try {
			await rateLimiter.consume(remoteIp);
			next();
		} catch (error: unknown) {
			next(new ThrottledError(error as RateLimiterRes));
		}
	});
}
