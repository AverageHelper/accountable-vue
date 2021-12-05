export interface DataItem {
	[key: string]: unknown;
	_id: string;
}

abstract class _PathReference {
	public readonly path: Readonly<string>;
	public abstract readonly plurality: "single" | "plural";

	constructor(path: string) {
		if (path === "") {
			throw new TypeError("Argument 'path' must not be empty");
		}
		this.path = path;
	}

	get id(): Readonly<string> {
		const components = this.path.split("/");
		return components[components.length - 1] ?? this.path;
	}
}

export class DocumentReference extends _PathReference {
	public readonly plurality: "single";

	constructor(path: string) {
		super(path);
		this.plurality = "single";
	}
}

export class CollectionReference extends _PathReference {
	public readonly plurality: "plural";

	constructor(path: string) {
		super(path);
		this.plurality = "plural";
	}
}
