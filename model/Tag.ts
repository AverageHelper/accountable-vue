import type { ColorID } from "./Color";
import type { Model } from "./utility/Model";
import { randomColor, isColorId } from "./Color";
import isString from "lodash/isString";

export interface Tag extends Model<"Tag"> {
	readonly name: string;
	readonly colorId: ColorID;
}

export type TagRecordParams = Pick<Tag, "colorId" | "name">;

export function tag(params: Omit<Tag, "objectType">): Tag {
	return {
		colorId: isColorId(params.colorId) ? params.colorId : randomColor(),
		id: params.id,
		name: params.name.trim(),
		objectType: "Tag",
	};
}

export function isTagRecord(tbd: unknown): tbd is TagRecordParams {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"name" in tbd &&
		"colorId" in tbd &&
		isString((tbd as TagRecordParams).name) &&
		isColorId((tbd as TagRecordParams).colorId)
	);
}

export function recordFromTag(tag: Tag): TagRecordParams {
	return {
		colorId: tag.colorId,
		name: tag.name,
	};
}
