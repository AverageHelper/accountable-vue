import type { Model } from "./utility/Model";
import isDate from "lodash/isDate";
import isNumber from "lodash/isNumber";
import isString from "lodash/isString";

function isStringOrNull(tbd: unknown): tbd is string | null {
	return tbd === null || isString(tbd);
}

export interface Coordinate {
	lat: number;
	lng: number;
}

export function isCoordinate(tbd: unknown): tbd is Coordinate {
	return (
		tbd !== undefined &&
		tbd !== null &&
		typeof tbd === "object" &&
		Boolean(tbd) &&
		!Array.isArray(tbd) &&
		"lat" in tbd &&
		"lng" in tbd &&
		isNumber((tbd as Coordinate).lat) &&
		isNumber((tbd as Coordinate).lng)
	);
}

function isCoordinateOrNull(tbd: unknown): tbd is Coordinate | null {
	return tbd === null || isCoordinate(tbd);
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
		lastUsed: new Date(params.lastUsed), // in case this is actually a string
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
		"subtitle" in tbd &&
		"coordinate" in tbd &&
		"lastUsed" in tbd &&
		isString((tbd as LocationRecordParams).title) &&
		isStringOrNull((tbd as LocationRecordParams).subtitle) &&
		isCoordinateOrNull((tbd as LocationRecordParams).coordinate) &&
		(isDate((tbd as LocationRecordParams).lastUsed) ||
			isString((tbd as LocationRecordParams).lastUsed))
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
