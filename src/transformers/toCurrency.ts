import type { Dinero } from "dinero.js";
import { getNumberFormatter } from "../i18n";
import { toFormat } from "dinero.js";

type NegativeStyle = "accounting" | "standard";

export function intlFormat(
	dinero: Dinero<number>,
	negativeStyle: NegativeStyle = "accounting"
): string {
	return toFormat(dinero, ({ amount, currency }) => {
		const formatter = getNumberFormatter({
			style: "currency",
			currency: currency.code,
			currencySign: negativeStyle,
		});
		return formatter.format(amount);
	});
}
