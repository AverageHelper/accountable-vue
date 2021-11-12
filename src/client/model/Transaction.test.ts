import type { TransactionRecordType } from "./Transaction";
import { Transaction } from "./Transaction";

describe("Transaction record", () => {
	test.each`
		type             | amount
		${"expense"}     | ${-10}
		${"expense"}     | ${-1}
		${"expense"}     | ${-0.1}
		${"expense"}     | ${-0.01}
		${"transaction"} | ${0}
		${"income"}      | ${0.01}
		${"income"}      | ${0.1}
		${"income"}      | ${1}
		${"income"}      | ${10}
	`(
		"returns a type of '$type' if the record amount is $amount",
		({ type, amount }: { type: TransactionRecordType; amount: number }) => {
			const transaction = new Transaction("", "", { amount });
			expect(transaction.type).toBe(type);
		}
	);
});
