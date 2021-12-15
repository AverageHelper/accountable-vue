export class TimeoutError extends Error {
	constructor(timeout: number) {
		super(`Failed to finish operation within ${timeout} ms`);
		this.name = "TimeoutError";
	}
}

export async function timeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
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
