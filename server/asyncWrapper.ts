import type { RequestHandler, Request, Response, NextFunction } from "express";

type AsyncRequestHandler<P = ParamsDictionary, ResBody = unknown, ReqBody = unknown> = (
	req: Request<P, ResBody, ReqBody>,
	res: Response,
	next: NextFunction
) => Promise<void>;

/**
 * Wraps an asynchronous promise handler in a normal handler.
 *
 * @param fn The asynchronous request handler to call.
 * @returns a request handler that passes thrown errors to `next`
 */
export const asyncWrapper = <P = ParamsDictionary, ResBody = unknown, ReqBody = unknown>(
	fn: AsyncRequestHandler<P, ResBody, ReqBody>
): RequestHandler<P, ResBody, ReqBody> => {
	// Don't sneeze on this, it works
	return function asyncUtilWrap(this: void, req, res, next): void {
		const fnReturn = fn(req, res, next);
		// eslint-disable-next-line promise/prefer-await-to-then, promise/no-callback-in-promise
		Promise.resolve(fnReturn).catch(next);
	};
};
