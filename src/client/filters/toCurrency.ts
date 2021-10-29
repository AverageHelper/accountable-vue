export type CurrencyCode = "USD";

export function toCurrency(value: number, currency: CurrencyCode = "USD"): string {
	const isNegative = value < 0;
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	});
	const formatted = formatter.format(Math.abs(value));
	if (isNegative) {
		return `(${formatted})`;
	}
	return formatted;
}
