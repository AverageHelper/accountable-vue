import type { Identifiable } from "./utility/Identifiable";
import isString from "lodash/isString";

export interface Coordinate {
	lat: number;
	lng: number;
}

export interface LocationRecordParams {
	title: string;
	subtitle: string | null;
	coordinate: Coordinate | null;
	lastUsed: Date;
}

export class Location implements Identifiable<string>, LocationRecordParams {
	public readonly objectType = "Location";
	public readonly id: string;
	public readonly title: string;
	public readonly subtitle: string | null;
	public readonly coordinate: Coordinate | null;
	public readonly lastUsed: Date;

	constructor(id: string, title: string, record: Omit<LocationRecordParams, "title">) {
		this.id = id;
		this.title = title.trim();
		const defaultRecord = Location.defaultRecord(record);
		this.subtitle = (record.subtitle?.trim() ?? "") || defaultRecord.subtitle;
		this.coordinate = record.coordinate ?? defaultRecord.coordinate;
		this.lastUsed = record.lastUsed ?? defaultRecord.lastUsed;
	}

	static defaultRecord(this: void, record?: Partial<LocationRecordParams>): LocationRecordParams {
		return {
			title: record?.title ?? "",
			subtitle: record?.subtitle ?? null,
			coordinate: record?.coordinate ?? null,
			lastUsed: record?.lastUsed ?? new Date(),
		};
	}

	static isRecord(this: void, toBeDetermined: unknown): toBeDetermined is LocationRecordParams {
		return (
			typeof toBeDetermined === "object" &&
			toBeDetermined !== null &&
			toBeDetermined !== undefined &&
			Boolean(toBeDetermined) &&
			!Array.isArray(toBeDetermined) &&
			"title" in toBeDetermined &&
			isString((toBeDetermined as LocationRecordParams).title)
		);
	}

	toRecord(): LocationRecordParams {
		return {
			title: this.title,
			subtitle: this.subtitle,
			coordinate: this.coordinate,
			lastUsed: this.lastUsed,
		};
	}

	updatedWith(params: Partial<LocationRecordParams>): Location {
		const thisRecord = this.toRecord();
		return new Location(this.id, params.title ?? this.title, { ...thisRecord, ...params });
	}
}
