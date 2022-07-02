import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "./db";
import type { EPackage, HashStore } from "./cryption";
import type { Tag, TagRecordParams } from "../model/Tag";
import { encrypt } from "./cryption";
import { collection, db, doc, recordFromSnapshot, setDoc, deleteDoc } from "./db";
import { isTagRecord, recordFromTag, tag } from "../model/Tag";

export type TagRecordPackage = EPackage<"Tag">;

export function tagsCollection(): CollectionReference<TagRecordPackage> {
	return collection<TagRecordPackage>(db, "tags");
}

function tagRef(tag: Tag): DocumentReference<TagRecordPackage> {
	return doc<TagRecordPackage>(db, "tags", tag.id);
}

export function tagFromSnapshot(doc: QueryDocumentSnapshot<TagRecordPackage>, dek: HashStore): Tag {
	const { id, record } = recordFromSnapshot(doc, dek, isTagRecord);
	return tag({ id, ...record });
}

export async function createTag(
	record: TagRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Tag> {
	const pkg = encrypt(record, "Tag", dek);
	const ref = doc(tagsCollection());
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return tag({ id: ref.id, ...record });
}

export async function updateTag(tag: Tag, dek: HashStore, batch?: WriteBatch): Promise<void> {
	const record = recordFromTag(tag);
	const pkg = encrypt(record, "Tag", dek);
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
