import type { CollectionID } from "./schemas";

export class CollectionReference {
	public readonly id: Readonly<CollectionID>;

	constructor(id: CollectionID) {
		this.id = id;
	}
}

export class DocumentReference {
	public readonly id: Readonly<string>;
	public readonly parent: Readonly<CollectionReference>;

	constructor(parent: CollectionReference, id: string) {
		this.parent = parent;
		this.id = id;
	}
}
