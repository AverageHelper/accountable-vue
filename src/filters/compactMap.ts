export function compactMap<T, U>(
	array: ReadonlyArray<T>,
	callbackfn: (value: T, index: number, array: ReadonlyArray<T>) => U
): Array<NonNullable<U>> {
	const newArray: Array<NonNullable<U>> = [];

	array.forEach((value, index, array) => {
		const newValue = callbackfn(value, index, array);
		if (newValue !== null && newValue !== undefined) {
			newArray.push(newValue as NonNullable<U>);
		}
	});

	return newArray;
}
