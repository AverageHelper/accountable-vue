/**
 * For each element in `array`, aggregate the result of calling `callback(element, index, array)`
 *  into `Promise.all` and return the resulting array
 *
 * @param array An array of elements to iterate over.
 * @param callback An async function to run
 *  on each element of the array.
 *
 * @returns A Promise which resolves or rejects when each callback has resolved
 *  with every array element, or one of the callbacks has rejected, respectively.
 */
export async function asyncMap<A, B>(
	array: Array<A>,
	callback: (value: A, index: number, array: Array<A>) => Promise<B>
): Promise<Array<B>> {
	return await Promise.all(array.map(callback));
}
