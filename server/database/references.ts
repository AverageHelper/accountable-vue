import type { AnyDataItem, CollectionID } from "./schemas";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class CollectionReference<T extends AnyDataItem> {
	public readonly id: Readonly<CollectionID>;

	constructor(id: CollectionID) {
		this.id = id;
	}
}

export class DocumentReference<T extends AnyDataItem> {
	public readonly id: Readonly<string>;
	public readonly parent: Readonly<CollectionReference<T>>;

	constructor(parent: CollectionReference<T>, id: string) {
		this.parent = parent;
		this.id = id;
	}
}
