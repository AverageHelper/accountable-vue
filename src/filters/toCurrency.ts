export type CurrencyCode = "USD";

export function toCurrency(value: number | bigint, currency: CurrencyCode = "USD"): string {
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	});
	return formatter.format(value);
}
