import { simplifiedByteCount } from "./simplifiedByteCount";

describe("Human-readable byte count formatter", () => {
	// ** Positive numbers
	test.each`
		num                 | result
		${0}                | ${"0 byte"}
		${1}                | ${"1 byte"}
		${100}              | ${"100 byte"}
		${1000}             | ${"1 kB"}
		${10000}            | ${"10 kB"}
		${10500}            | ${"10.5 kB"}
		${1000000}          | ${"1 MB"}
		${1000000000}       | ${"1 GB"}
		${22550000000}      | ${"22.55 GB"}
		${1000000000000}    | ${"1 TB"}
		${1000000000000000} | ${"1 PB"}
		${1000000000001000} | ${"1 PB"}
		${9007199254740991} | ${"9.01 PB"}
	`("formats $num to '$result'", ({ num, result }: { num: number; result: string }) => {
		expect(simplifiedByteCount(num, "en-US")).toBe(result);
	});

	// ** Negative numbers
	test.each`
		num                  | result
		${-0}                | ${"-0 byte"}
		${-100}              | ${"-100 byte"}
		${-1000}             | ${"-1 kB"}
		${-10000}            | ${"-10 kB"}
		${-10500}            | ${"-10.5 kB"}
		${-1000000}          | ${"-1 MB"}
		${-1000000000}       | ${"-1 GB"}
		${-22550000000}      | ${"-22.55 GB"}
		${-1000000000000}    | ${"-1 TB"}
		${-1000000000000000} | ${"-1 PB"}
		${-1000000000001000} | ${"-1 PB"}
		${-9007199254740991} | ${"-9.01 PB"}
	`("formats $num to '$result'", ({ num, result }: { num: number; result: string }) => {
		expect(simplifiedByteCount(num, "en-US")).toBe(result);
	});
});
