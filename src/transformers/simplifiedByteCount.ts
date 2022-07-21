import type { LocaleCode } from "../i18n";
import { getLocaleFromNavigator } from "svelte-i18n";

/**
 * Creates a human-readable string from a given byte count.
 *
 * @example
 * ```ts
 * const bytes = 1000;
 * const str = simplifiedByteCount(bytes);
 * // str === "1 kB"
 * ```
 *
 * @param num The number of bytes to represent.
 * @param locale The locale for which to format the result.
 *
 * @returns A user-readable string representing the byte count.
 */
export function simplifiedByteCount(num: number, locale?: LocaleCode): string {
	if (typeof num !== "number" || Number.isNaN(num)) {
		throw new TypeError("Expected a non-NaN number");
	}

	// If negative, use the absolute value
	const neg = num < 0 || Object.is(num, -0);
	if (neg) num = -num;

	// NOTE: Intl.NumberFormat formats -0 with a negative symbol, so we check for -0 specifically, above, and treat it like other negative values.

	/**
	 * Byte units sanctioned for use in ECMAScript
	 *
	 * @see https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-issanctionedsimpleunitidentifier
	 */
	const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"] as const;

	type Unit = typeof units[number];

	// Get the nearest applicable unit
	const exponent: number =
		num > 0 ? Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1) : 0;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const unit: Unit = units[exponent] ?? units[units.length - 1]!;
	// ASSUMPTION: The `units` array is never empty

	// Set up a unit formatter for the selected locale
	const formatter = Intl.NumberFormat(locale ?? getLocaleFromNavigator() ?? undefined, {
		style: "unit",
		unit,
		maximumFractionDigits: 2,
	});

	// Format the value, prepending a "-" if the value was negative
	const formatted = formatter.format(num / 1000 ** exponent);
	return `${neg ? "-" : ""}${formatted}`;
}
