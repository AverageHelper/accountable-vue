import type { Model } from "./utility/Model";
import isString from "lodash/isString";

export interface Attachment extends Model<"Attachment"> {
	readonly title: string;
	readonly notes: string | null;
	readonly type: string;
	readonly createdAt: Date;
	readonly storagePath: string;
}

export type AttachmentRecordParams = Pick<
	Attachment,
	"createdAt" | "notes" | "storagePath" | "title" | "type"
>;

export function attachment(params: Omit<Attachment, "objectType">): Attachment {
	return {
		createdAt: params.createdAt,
		id: params.id,
		notes: (params.notes?.trim() ?? "") || null,
		objectType: "Attachment",
		storagePath: params.storagePath,
		title: params.title.trim() || `Attachment ${Math.floor(Math.random() * 10) + 1}`, // TODO: I18N
		type: params.type || "unknown",
	};
}

export function isAttachmentRecord(tbd: unknown): tbd is AttachmentRecordParams {
	return (
		(tbd !== undefined &&
			tbd !== null &&
			typeof tbd === "object" &&
			Boolean(tbd) &&
			!Array.isArray(tbd) &&
			"createdAt" in tbd &&
			"title" in tbd &&
			"notes" in tbd &&
			(tbd as AttachmentRecordParams).title === null) ||
		(isString((tbd as AttachmentRecordParams).title) &&
			(tbd as AttachmentRecordParams).notes === null) ||
		isString((tbd as AttachmentRecordParams).notes)
	);
}

export function recordFromAttachment(attachment: Attachment): AttachmentRecordParams {
	return {
		createdAt: attachment.createdAt,
		notes: attachment.notes,
		storagePath: attachment.storagePath,
		title: attachment.title,
		type: attachment.type,
	};
}
