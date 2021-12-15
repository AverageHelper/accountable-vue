import type { RequestHandler, Request, Response, NextFunction } from "express";

// This matches the internal definition in express
// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/consistent-type-definitions
type ParamsDictionary = {};

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
	return (req, res, next): void => {
		/* eslint-disable promise/prefer-await-to-then, promise/no-callback-in-promise */
		void fn(req, res, next)
			.then(() => {
				if (!res.headersSent) next();
			})
			.catch(error => {
				if (!res.headersSent) next(error);
			});
		/* eslint-enable promise/prefer-await-to-then, promise/no-callback-in-promise */
	};
};
