import type { Identifiable } from "./utility/Identifiable";
import isString from "lodash/isString";

export interface AttachmentRecordParams {
	title: string;
	notes: string | null;
	type: string;
	createdAt: Date;
	storagePath: string;
}

export class Attachment implements Identifiable<string>, AttachmentRecordParams {
	public readonly objectType = "Attachment";
	public readonly id: string;
	public readonly type: string;
	public readonly title: string;
	public readonly notes: string | null;
	public readonly createdAt: Date;
	public readonly storagePath: string;

	constructor(
		id: string,
		storagePath: string,
		record?: Partial<Omit<AttachmentRecordParams, "storagePath">>
	) {
		this.id = id;
		this.storagePath = storagePath;
		const defaultRecord = Attachment.defaultRecord(record);
		this.type = record?.type ?? defaultRecord.type;
		this.title = (record?.title?.trim() ?? defaultRecord.title) || defaultRecord.title;
		this.notes = (record?.notes?.trim() ?? "") || defaultRecord.notes;
		this.createdAt =
			// handle case where decryption doesn't return a Date object
			(record?.createdAt ? new Date(record.createdAt) : undefined) ?? defaultRecord.createdAt;
	}

	static defaultRecord(
		this: void,
		record?: Partial<AttachmentRecordParams>
	): Omit<AttachmentRecordParams, "storagePath"> {
		return {
			type: record?.type ?? "unknown",
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

	toRecord(): AttachmentRecordParams & { id: string } {
		return {
			id: this.id,
			type: this.type,
			title: this.title,
			notes: this.notes,
			createdAt: this.createdAt,
			storagePath: this.storagePath,
		};
	}

	updatedWith(params: Partial<AttachmentRecordParams>): Attachment {
		const thisRecord = this.toRecord();
		return new Attachment(this.id, params.storagePath ?? this.storagePath, {
			...thisRecord,
			...params,
		});
	}
}
