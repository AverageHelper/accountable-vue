import type { Transaction, TransactionRecordParams } from "../Transaction";

type Created = Pick<Transaction | TransactionRecordParams, "createdAt">;

/**
 * A sort function that orders the given values in reverse-chronological order.
 */
export function reverseChronologically(this: void, a: Created, b: Created): number {
	return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * A sort function that orders the given values in chronological order.
 */
export function chronologically(this: void, a: Created, b: Created): number {
	return a.createdAt.getTime() - b.createdAt.getTime();
}
