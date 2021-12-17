import type { RateLimiterRes } from "rate-limiter-flexible";
import type { RequestHandler } from "express";
import { asyncWrapper } from "../asyncWrapper.js";
import { dbPromise } from "../database/mongo.js";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { ThrottledError } from "../responses.js";

const points = 10; // 10 tries
const duration = 10 * 60; // per 10 minutes
const blockDuration = 10 * 60; // block for 10 mins after points run out

const rateLimiterPromise: Promise<RateLimiterMongo> = dbPromise
	.then((storeClient): RateLimiterMongo => {
		return new RateLimiterMongo({ storeClient, points, duration, blockDuration });
	})
	.catch((error: unknown) => {
		console.error(error);
		throw error;
	});

/**
 * Returns middleware that prevents an IP address from sending more than
 * 10 requests in 10 minutes.
 */
export function throttle<P = ParamsDictionary, ResBody = unknown, ReqBody = unknown>(
	this: void
): RequestHandler<P, ResBody, ReqBody> {
	return asyncWrapper(async (req, res, next) => {
		const remoteIp = req.ip;
		const rateLimiter = await rateLimiterPromise;
		try {
			await rateLimiter.consume(remoteIp);
			next();
		} catch (error: unknown) {
			next(new ThrottledError(error as RateLimiterRes));
		}
	});
}
