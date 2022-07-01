import type { Model } from "./utility/Model";
import isString from "lodash/isString";

export interface Coordinate {
	lat: number;
	lng: number;
}

export interface Location extends Model<"Location"> {
	readonly title: string;
	readonly subtitle: string | null;
	readonly coordinate: Coordinate | null;
	readonly lastUsed: Date;
}

export type LocationRecordParams = Pick<Location, "coordinate" | "lastUsed" | "subtitle" | "title">;

export function location(params: Omit<Location, "objectType">): Location {
	return {
		coordinate: params.coordinate,
		id: params.id,
		lastUsed: params.lastUsed,
		objectType: "Location",
		subtitle: (params.subtitle?.trim() ?? "") || null,
		title: params.title.trim() || "Untitled",
	};
}

export function isLocationRecord(tbd: unknown): tbd is LocationRecordParams {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"title" in tbd &&
		isString((tbd as LocationRecordParams).title)
	);
}

export function recordFromLocation(location: Location): LocationRecordParams {
	return {
		coordinate: location.coordinate,
		lastUsed: location.lastUsed,
		subtitle: location.subtitle,
		title: location.title,
	};
}
