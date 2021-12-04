import type { RequestHandler, Request, Response } from "express";

type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Wraps an asynchronous promise handler in a normal handler.
 *
 * @param fn The asynchronous request handler to call.
 * @returns a request handler that passes thrown errors to `next`
 */
export const asyncWrapper = (fn: AsyncRequestHandler): RequestHandler => {
	return (req, res, next): void => {
		void fn(req, res)
			// eslint-disable-next-line promise/prefer-await-to-then, promise/no-callback-in-promise
			.catch(error => next(error));
	};
};
