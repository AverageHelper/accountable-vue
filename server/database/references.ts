import type { AnyDataItem, CollectionID } from "./schemas.js";
import { isCollectionId } from "./schemas.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class CollectionReference<T extends AnyDataItem> {
	public readonly uid: Readonly<string>;
	public readonly id: Readonly<CollectionID>;

	constructor(uid: string, id: CollectionID) {
		if (!isCollectionId(id)) throw new TypeError(`${JSON.stringify(id)} is not a collection ID`);
		this.uid = uid;
		this.id = id;
	}

	get path(): string {
		return `users/${this.uid}/${this.id}`;
	}

	toString(): string {
		return JSON.stringify({
			id: this.id,
		});
	}
}

export class DocumentReference<T extends AnyDataItem> {
	public readonly id: Readonly<string>;
	public readonly parent: Readonly<CollectionReference<T>>;

	constructor(parent: CollectionReference<T>, id: string) {
		this.parent = parent;
		this.id = id;
	}

	get uid(): string {
		return this.parent.uid.slice();
	}

	get path(): string {
		return this.parent.path.concat("/", this.id);
	}

	toString(): string {
		return JSON.stringify({
			id: this.id,
			parent: this.parent.id,
		});
	}
}
