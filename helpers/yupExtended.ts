/* eslint-disable no-template-curly-in-string, @typescript-eslint/method-signature-style */
// eslint-disable-next-line jest/no-commented-out-tests
/*

I don't wanna have to write this all again if we go with yup later.
Might make a package out of it idk.

See https://github.com/jquense/yup/issues/593#issuecomment-1011536658
for why this had to happen.

import type { BaseSchema } from "yup"; // Expects yup@0.32.11
import type { Maybe } from "yup/lib/types";
import type { MixedSchema } from "yup/lib/mixed";
import { mixed } from "yup";

// Two
export function union<
	T1,
	T2,
	TCast1 extends Maybe<T1>,
	TCast2 extends Maybe<T2>,
	C1,
	C2,
	O1 extends T1,
	O2 extends T2
>(
	...schemas: [BaseSchema<TCast1, C1, O1>, BaseSchema<TCast2, C2, O2>]
): MixedSchema<TCast1 | TCast2, C1 | C2, O1 | O2>;

// Three
export function union<
	T1,
	T2,
	T3,
	TCast1 extends Maybe<T1>,
	TCast2 extends Maybe<T2>,
	TCast3 extends Maybe<T3>,
	C1,
	C2,
	C3,
	O1 extends T1,
	O2 extends T2,
	O3 extends T3
>(
	...schemas: [BaseSchema<TCast1, C1, O1>, BaseSchema<TCast2, C2, O2>, BaseSchema<TCast3, C3, O3>]
): MixedSchema<TCast1 | TCast2 | TCast3, C1 | C2 | C3, O1 | O2 | O3>;

// Mix them all together
export function union(...schemas: Array<BaseSchema>): MixedSchema<unknown, unknown, unknown> {
	return mixed().test({
		name: "union",
		message: "value did not match any schema: ${value}",
		test(value) {
			// The real magic
			return schemas.some(s => s.isValidSync(value));
		},
	}) as MixedSchema<unknown, unknown, unknown>;
}
*/

export {};
