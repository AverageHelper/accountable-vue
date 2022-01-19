import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";
import type { TagRecordParams } from "../model/Tag";
import type { EPackage, HashStore } from "./cryption";
import { encrypt } from "./cryption";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";
import { Tag } from "../model/Tag";

interface TagRecordPackageMetadata {
	objectType: "Tag";
}
export type TagRecordPackage = EPackage<TagRecordPackageMetadata>;

export function tagsCollection(): CollectionReference<TagRecordPackage> {
	return collection<TagRecordPackage>(db, "tags");
}

function tagRef(tag: Tag): DocumentReference<TagRecordPackage> {
	return doc<TagRecordPackage>(db, "tags", tag.id);
}

export function tagFromSnapshot(doc: QueryDocumentSnapshot<TagRecordPackage>, dek: HashStore): Tag {
	const { id, record } = recordFromSnapshot(doc, dek, Tag.isRecord);
	return new Tag(id, record);
}

export async function createTag(
	record: TagRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Tag> {
	const meta: TagRecordPackageMetadata = {
		objectType: "Tag",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = doc(tagsCollection());
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return new Tag(ref.id, record);
}

export async function updateTag(tag: Tag, dek: HashStore, batch?: WriteBatch): Promise<void> {
	const meta: TagRecordPackageMetadata = {
		objectType: "Tag",
	};
	const record: TagRecordParams = tag.toRecord();
	const pkg = encrypt(record, meta, dek);
	const ref = tagRef(tag);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteTag(tag: Tag, batch?: WriteBatch): Promise<void> {
	const ref = tagRef(tag);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
