import type { Identifiable } from "./Identifiable";

export interface Model<T extends string> extends Identifiable<Readonly<string>> {
	readonly id: Readonly<string>;
	readonly objectType: Readonly<T>;
}
