/* ~~~~~~~~~
 * As defined in /openapi.yaml
 * ~~~~~~~~~ */

const BASE = "/v0";

/**
 * Route for:
 * - GET `/v0/`
 */
export function root(): "/v0/" {
	return `${BASE}/`;
}

/**
 * Route for:
 * - GET `/v0/ping`
 */
export function ping(): "/v0/ping" {
	return `${BASE}/ping`;
}

/**
 * Route for:
 * - GET `/v0/version`
 */
export function version(): "/v0/version" {
	return `${BASE}/version`;
}

/**
 * Route for:
 * - POST `/v0/join`
 */
export function authJoin(): "/v0/join" {
	return `${BASE}/join`;
}

/**
 * Route for:
 * - POST `/v0/login`
 */
export function authLogIn(): "/v0/login" {
	return `${BASE}/login`;
}

/**
 * Route for:
 * - POST `/v0/login`
 */
export function authRefreshSession(): "/v0/session" {
	return `${BASE}/session`;
}

/**
 * Route for:
 * - POST `/v0/logout`
 */
export function authLogOut(): "/v0/logout" {
	return `${BASE}/logout`;
}

/**
 * Route for:
 * - POST `/v0/leave`
 */
export function authLeave(): "/v0/leave" {
	return `${BASE}/leave`;
}

/**
 * Route for:
 * - POST `/v0/updatepassword`
 */
export function authUpdatePassword(): "/v0/updatepassword" {
	return `${BASE}/updatepassword`;
}

/**
 * Route for:
 * - POST `/v0/updateaccountid`
 */
export function authUpdateAccountId(): "/v0/updateaccountid" {
	return `${BASE}/updateaccountid`;
}

/**
 * Route for:
 * - POST `/v0/db/users/{user.id}`
 */
export function databaseBatchWrite<UID extends string>(uid: UID): `/v0/db/users/${typeof uid}` {
	return `${BASE}/db/users/${uid}`;
}

type CollectionId =
	| "accounts"
	| "attachments"
	| "keys"
	| "locations"
	| "tags"
	| "transactions"
	| "users";

/**
 * Route for:
 * - GET    `/v0/db/users/{user.id}/{collection.id}`
 * - DELETE `/v0/db/users/{user.id}/{collection.id}`
 */
export function databaseCollection<UID extends string>(
	uid: UID,
	collectionId: CollectionId
): `/v0/db/users/${typeof uid}/${typeof collectionId}` {
	return `${BASE}/db/users/${uid}/${collectionId}`;
}

/**
 * Route for:
 * - GET    `/v0/db/users/{user.id}/{collection.id}/{document.id}`
 * - POST   `/v0/db/users/{user.id}/{collection.id}/{document.id}`
 * - DELETE `/v0/db/users/{user.id}/{collection.id}/{document.id}`
 */
export function databaseDocument<UID extends string, Doc extends string>(
	uid: UID,
	collectionId: CollectionId,
	documentId: Doc
): `/v0/db/users/${typeof uid}/${typeof collectionId}/${typeof documentId}` {
	return `${BASE}/db/users/${uid}/${collectionId}/${documentId}`;
}

/**
 * Route for:
 * - GET    `/v0/files/users/{user.id}/attachments/{file.name}`
 * - POST   `/v0/files/users/{user.id}/attachments/{file.name}`
 * - DELETE `/v0/files/users/{user.id}/attachments/{file.name}`
 */
export function storageFile<UID extends string, File extends string>(
	uid: UID,
	fileName: File
): `/v0/files/users/${typeof uid}/attachments/${typeof fileName}` {
	return `${BASE}/files/users/${uid}/attachments/${fileName}`;
}
