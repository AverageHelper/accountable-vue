export class TimeoutError extends Error {
	constructor(timeout: number) {
		super(`Failed to finish operation within ${timeout} ms`);
		this.name = "TimeoutError";
	}
}

/**
 * Awaits a promise for at most a given number of milliseconds. If
 * the promise has not resolved by the time the given duration has
 * elapsed, then a {@link TimeoutError} is thrown.
 *
 * @param fn A function that returns a promise that should resolve on time.
 * @param timeout The number of milliseconds to wait before doing something.
 * @returns The result of the `Promise`, if it resolved.
 * @throws the error thrown by the promise returned by the `fn`, or a
 * {@link TimeoutError} if the promise did not resolve in time.
 */
export async function timeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
	return await new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new TimeoutError(timeout));
		}, timeout);
		/* eslint-disable promise/prefer-await-to-then */
		void fn()
			.then(resolve)
			.catch(reject)
			.finally(() => {
				clearTimeout(timer);
			});
		/* eslint-enable promise/prefer-await-to-then */
	});
}
