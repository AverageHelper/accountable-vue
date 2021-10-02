import { v4 as uuid } from "uuid";
export { uuid };

export type UUID = ReturnType<typeof uuid>;

export interface Identifiable<ID> {
	id: ID;
}
