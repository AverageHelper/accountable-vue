// eslint-disable-next-line jest/no-commented-out-tests
/*
import type { InferType } from "yup";
import { union } from "./yupExtended";
import { number, string } from "yup";

describe("Unioned schemas", () => {
	const stringSchema = string().required().strict();
	const numberSchema = number().required().strict();
	const stringOrNumberUnion = union(stringSchema, numberSchema);
	type StringOrNumber = InferType<typeof stringOrNumberUnion>;

	const str1 = "yo";
	const str2 = "not empty";
	const invalidStr1 = ""; // empty
	const notStr1 = 0;
	const notStr2 = [] as Array<never>;
	const num1 = 0;
	const num2 = -42.8;
	const invalidNum1 = Number.NaN;
	const notNum1 = str1;
	const notNum2 = notStr2;
	const notDefined = undefined;

	test("SANITY: string schemas validate correctly", () => {
		expect(stringSchema.isValidSync(str1)).toBeTrue();
		expect(stringSchema.isValidSync(str2)).toBeTrue();
		expect(stringSchema.isValidSync(invalidStr1)).toBeFalse();
		expect(stringSchema.isValidSync(notStr1)).toBeFalse();
		expect(stringSchema.isValidSync(notStr2)).toBeFalse();
		expect(stringSchema.isValidSync(notDefined)).toBeFalse();
	});

	test("SANITY: number schemas validate correctly", () => {
		expect(numberSchema.isValidSync(num1)).toBeTrue();
		expect(numberSchema.isValidSync(num2)).toBeTrue();
		expect(numberSchema.isValidSync(invalidNum1)).toBeFalse();
		expect(numberSchema.isValidSync(notNum1)).toBeFalse();
		expect(numberSchema.isValidSync(notNum2)).toBeFalse();
		expect(numberSchema.isValidSync(notDefined)).toBeFalse();
	});

	test("string or number schema validates correctly", () => {
		let value: StringOrNumber = str1;
		expect(stringOrNumberUnion.isValidSync(value)).toBeTrue();
		value = str2;
		expect(stringOrNumberUnion.isValidSync(value)).toBeTrue();

		value = num1;
		expect(stringOrNumberUnion.isValidSync(value)).toBeTrue();
		value = num2;
		expect(stringOrNumberUnion.isValidSync(value)).toBeTrue();

		expect(stringOrNumberUnion.isValidSync(invalidStr1)).toBeFalse();
		expect(stringOrNumberUnion.isValidSync(invalidNum1)).toBeFalse();
		expect(stringOrNumberUnion.isValidSync(notStr2)).toBeFalse();
		expect(stringOrNumberUnion.isValidSync(notDefined)).toBeFalse();
	});
});
*/

export {};
