interface MongoObject {
	_id: string;
	uid: string;
}

export interface DataItem extends MongoObject {
	ciphertext: string;
	objectType: string;
}

export function isDataItem(tbd: AnyDataItem): tbd is DataItem {
	return "ciphertext" in tbd && "objectType" in tbd;
}

export interface Keys extends MongoObject {
	dekMaterial: string;
	passSalt: string;
	oldDekMaterial?: string;
	oldPassSalt?: string;
}

export function isKeys(tbd: AnyDataItem): tbd is Keys {
	return "dekMaterial" in tbd && "passSalt" in tbd;
}

export type AnyDataItem = DataItem | Keys;

export type CollectionID =
	| "accounts" //
	| "attachments"
	| "locations"
	| "tags"
	| "transactions";

const allCollectionIds = new Set<CollectionID>([
	"accounts",
	"attachments",
	"locations",
	"tags",
	"transactions",
]);

export function isCollectionId(tbd: string): tbd is CollectionID {
	return allCollectionIds.has(tbd as CollectionID);
}
