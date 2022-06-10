/**
 * Creates a human-readable string from a given byte count.
 *
 * @example
 * ```ts
 * const bytes = 1000;
 * const str = simplifiedByteCount(count);
 * // str === "1 KB"
 * ```
 *
 * @param num The number of bytes to represent.
 * @returns A string representing the byte count.
 */
export function simplifiedByteCount(num: number): string {
	if (typeof num !== "number" || Number.isNaN(num)) {
		throw new TypeError("Expected a number"); // TODO: I18N
	}

	const neg = num < 0;
	const units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	if (neg) {
		num = -num;
	}

	if (num < 1) {
		return `${neg ? "-" : ""}${num} B`;
	}

	const exponent: number = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
	const unit: string = units[exponent] ?? "";
	const size: string = (num / 1000 ** exponent).toFixed(2);

	return `${neg ? "-" : ""}${size} ${unit}`;
}
