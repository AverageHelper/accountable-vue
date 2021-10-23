import type { Identifiable } from "./utility/Identifiable";
import isString from "lodash/isString";

export interface AttachmentRecordParams {
	title: string;
	notes: string | null;
	createdAt: Date;
	storageUrl: string;
	downloadUrl: string;
}

export class Attachment implements Identifiable<string>, AttachmentRecordParams {
	public readonly objectType = "Attachment";
	public readonly id: string;
	public readonly title: string;
	public readonly notes: string | null;
	public readonly createdAt: Date;
	public readonly storageUrl: string;
	public readonly downloadUrl: string;

	constructor(
		id: string,
		urls: { downloadUrl: string; storageUrl: string },
		record?: Partial<Omit<AttachmentRecordParams, "downloadUrl" | "storageUrl">>
	) {
		this.id = id;
		this.downloadUrl = urls.downloadUrl;
		this.storageUrl = urls.storageUrl;
		const defaultRecord = Attachment.defaultRecord(record);
		this.title = (record?.title?.trim() ?? defaultRecord.title) || defaultRecord.title;
		this.notes = (record?.notes?.trim() ?? "") || defaultRecord.notes;
		this.createdAt =
			// handle case where decryption doesn't return a Date object
			(record?.createdAt ? new Date(record.createdAt) : undefined) ?? defaultRecord.createdAt;
	}

	static defaultRecord(
		this: void,
		record?: Partial<AttachmentRecordParams>
	): Omit<AttachmentRecordParams, "downloadUrl" | "storageUrl"> {
		return {
			title: record?.title ?? `Attachment ${Math.floor(Math.random() * 10) + 1}`,
			notes: record?.notes ?? null,
			createdAt: record?.createdAt ?? new Date(),
		};
	}

	static isRecord(this: void, toBeDetermined: unknown): toBeDetermined is AttachmentRecordParams {
		return (
			(typeof toBeDetermined === "object" &&
				toBeDetermined !== null &&
				toBeDetermined !== undefined &&
				Boolean(toBeDetermined) &&
				!Array.isArray(toBeDetermined) &&
				"createdAt" in toBeDetermined &&
				"title" in toBeDetermined &&
				"notes" in toBeDetermined &&
				(toBeDetermined as AttachmentRecordParams).title === null) ||
			(isString((toBeDetermined as AttachmentRecordParams).title) &&
				(toBeDetermined as AttachmentRecordParams).notes === null) ||
			isString((toBeDetermined as AttachmentRecordParams).notes)
		);
	}

	toRecord(): Omit<AttachmentRecordParams, "downloadUrl"> & { id: string } {
		return {
			id: this.id,
			title: this.title,
			notes: this.notes,
			createdAt: this.createdAt,
			storageUrl: this.storageUrl,
		};
	}

	updatedWith(params: Partial<AttachmentRecordParams>): Attachment {
		const thisRecord = this.toRecord();
		return new Attachment(
			this.id,
			{
				downloadUrl: params.downloadUrl ?? this.downloadUrl,
				storageUrl: params.storageUrl ?? this.storageUrl,
			},
			{
				...thisRecord,
				...params,
			}
		);
	}
}
