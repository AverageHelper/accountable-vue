import type { TransactionRecordType } from "./Transaction";
import { dinero, toSnapshot } from "dinero.js";
import { intlFormat } from "../filters";
import { Transaction } from "./Transaction";
import { USD } from "@dinero.js/currencies";

describe("Transaction record", () => {
	describe.each`
		type             | amount   | formatted
		${"expense"}     | ${-10}   | ${"($10.00)"}
		${"expense"}     | ${-1}    | ${"($1.00)"}
		${"expense"}     | ${-0.1}  | ${"($0.10)"}
		${"expense"}     | ${-0.01} | ${"($0.01)"}
		${"transaction"} | ${0}     | ${"$0.00"}
		${"income"}      | ${0.01}  | ${"$0.01"}
		${"income"}      | ${0.1}   | ${"$0.10"}
		${"income"}      | ${1}     | ${"$1.00"}
		${"income"}      | ${10}    | ${"$10.00"}
	`(
		"amount $amount USD",
		(params: { type: TransactionRecordType; amount: number; formatted: string }) => {
			const { type, amount, formatted } = params;
			const transaction = new Transaction("", {
				// "amount" is number of smallest unit (cents). Multiply by 100 for USD.
				amount: toSnapshot(dinero({ amount: amount * 100, currency: USD })),
				accountId: "",
			});

			test(`returns a type of '${type}'`, () => {
				expect(transaction.type).toBe(type);
			});

			test(`currency format returns '${formatted}'`, () => {
				expect(intlFormat(transaction.amount)).toBe(formatted);
			});
		}
	);
});
