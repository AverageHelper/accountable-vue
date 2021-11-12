export type CurrencyCode = "USD";

type NegativeStyle = "accounting" | "hyphen";

export function toCurrency(
	value: number,
	negativeStyle: NegativeStyle = "accounting",
	currency: CurrencyCode = "USD"
): string {
	const isNegative = value < 0;
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	});
	const formatted = formatter.format(Math.abs(value));
	if (isNegative) {
		switch (negativeStyle) {
			case "accounting":
				return `(${formatted})`;
			case "hyphen":
				return `-${formatted}`;
		}
	}
	return formatted;
}
