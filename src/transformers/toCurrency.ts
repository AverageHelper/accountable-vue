import type { Dinero } from "dinero.js";
import { toFormat } from "dinero.js";

type NegativeStyle = "accounting" | "standard";

export function intlFormat(
	dinero: Dinero<number>,
	negativeStyle: NegativeStyle = "accounting"
): string {
	return toFormat(dinero, ({ amount, currency }) => {
		const formatter = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.code,
			currencySign: negativeStyle,
		});
		return formatter.format(amount);
	});
}
