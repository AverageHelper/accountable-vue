import type { ColorID } from "./Color";
import type { Identifiable } from "./utility/Identifiable";
import { randomColor, isColorId } from "./Color";
import isString from "lodash/isString";

export interface TagRecordParams {
	name: string;
	colorId: ColorID;
}

export class Tag implements Identifiable<string>, TagRecordParams {
	public readonly objectType = "Tag";
	public readonly id: string;
	public readonly name: string;
	public readonly colorId: ColorID;

	constructor(id: string, record: TagRecordParams) {
		this.id = id;
		this.name = record?.name.trim();
		this.colorId = record?.colorId ?? randomColor();
	}

	static isRecord(this: void, toBeDetermined: unknown): toBeDetermined is TagRecordParams {
		return (
			typeof toBeDetermined === "object" &&
			toBeDetermined !== null &&
			toBeDetermined !== undefined &&
			Boolean(toBeDetermined) &&
			!Array.isArray(toBeDetermined) &&
			"name" in toBeDetermined &&
			isString((toBeDetermined as TagRecordParams).name) &&
			"colorId" in toBeDetermined &&
			isColorId((toBeDetermined as TagRecordParams).colorId)
		);
	}

	toRecord(): TagRecordParams {
		return {
			name: this.name,
			colorId: this.colorId,
		};
	}

	updatedWith(params: Partial<TagRecordParams>): Tag {
		const thisRecord = this.toRecord();
		return new Tag(this.id, { ...thisRecord, ...params });
	}

	toString(): string {
		return JSON.stringify(this.toRecord());
	}
}
