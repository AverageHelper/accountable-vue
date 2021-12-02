import type {
	CollectionReference,
	DocumentReference,
	QueryDocumentSnapshot,
	WriteBatch,
} from "firebase/firestore";
import type { TagRecordParams } from "../model/Tag";
import type { EPackage, HashStore } from "./cryption";
import { encrypt } from "./cryption";
import { db, recordFromSnapshot } from "./db";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Tag } from "../model/Tag";

interface TagRecordPackageMetadata {
	objectType: "Tag";
}
type TagRecordPackage = EPackage<TagRecordPackageMetadata>;

export function tagsCollection(uid: string): CollectionReference<TagRecordPackage> {
	const path = `users/${uid}/tags`;
	return collection(db, path) as CollectionReference<TagRecordPackage>;
}

function tagRef(uid: string, tag: Tag): DocumentReference<TagRecordPackage> {
	const path = `users/${uid}/tags/${tag.id}`;
	return doc(db, path) as DocumentReference<TagRecordPackage>;
}

export function tagFromSnapshot(doc: QueryDocumentSnapshot<TagRecordPackage>, dek: HashStore): Tag {
	const { id, record } = recordFromSnapshot(doc, dek, Tag.isRecord);
	return new Tag(id, record);
}

export async function createTag(
	uid: string,
	record: TagRecordParams,
	dek: HashStore,
	batch?: WriteBatch
): Promise<Tag> {
	const meta: TagRecordPackageMetadata = {
		objectType: "Tag",
	};
	const pkg = encrypt(record, meta, dek);
	const ref = doc(tagsCollection(uid));
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
	return new Tag(ref.id, record);
}

export async function updateTag(
	uid: string,
	tag: Tag,
	dek: HashStore,
	batch?: WriteBatch
): Promise<void> {
	const meta: TagRecordPackageMetadata = {
		objectType: "Tag",
	};
	const record: TagRecordParams = tag.toRecord();
	const pkg = encrypt(record, meta, dek);
	const ref = tagRef(uid, tag);
	if (batch) {
		batch.set(ref, pkg);
	} else {
		await setDoc(ref, pkg);
	}
}

export async function deleteTag(uid: string, tag: Tag, batch?: WriteBatch): Promise<void> {
	const ref = tagRef(uid, tag);
	if (batch) {
		batch.delete(ref);
	} else {
		await deleteDoc(ref);
	}
}
