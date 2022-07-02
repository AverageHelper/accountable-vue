import { dinero, toSnapshot } from "dinero.js";
import { intlFormat } from "../transformers";
import { transaction } from "./Transaction";
import { USD } from "@dinero.js/currencies";

describe("Transaction record", () => {
	describe.each`
		amount   | formatted
		${-10}   | ${"($10.00)"}
		${-1}    | ${"($1.00)"}
		${-0.1}  | ${"($0.10)"}
		${-0.01} | ${"($0.01)"}
		${0}     | ${"$0.00"}
		${0.01}  | ${"$0.01"}
		${0.1}   | ${"$0.10"}
		${1}     | ${"$1.00"}
		${10}    | ${"$10.00"}
	`("amount $amount USD", (params: { amount: number; formatted: string }) => {
		const { amount, formatted } = params;
		const txn = transaction({
			id: "",
			// "amount" is number of smallest unit (cents). Multiply by 100 for USD.
			amount: toSnapshot(dinero({ amount: amount * 100, currency: USD })),
			accountId: "",
			attachmentIds: [],
			createdAt: new Date(),
			isReconciled: false,
			locationId: null,
			notes: null,
			tagIds: [],
			title: null,
		});

		test(`currency format returns '${formatted}'`, () => {
			expect(intlFormat(txn.amount)).toBe(formatted);
		});
	});
});
