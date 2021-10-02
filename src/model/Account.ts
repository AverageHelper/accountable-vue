import type { Identifiable, UUID } from "./utility/Identifiable";
import { uuid } from "./utility/Identifiable";

export interface AccountRecord extends Identifiable<UUID> {
	title: string;
	notes: string | null;
}

export class Account implements AccountRecord {
	public readonly id;
	public readonly title;
	public readonly notes;

	constructor(record?: Partial<AccountRecord>) {
		this.id = record?.id ?? uuid();
		this.title = record?.title ?? "";
		this.notes = record?.notes ?? null;
	}

	toRecord(): AccountRecord {
		return {
			id: this.id,
			title: this.title,
			notes: this.notes,
		};
	}
}
