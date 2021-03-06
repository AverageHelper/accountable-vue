/* eslint-disable deprecation/deprecation */
import type { KeyMaterial } from "./cryption";
import type { AccountableDB, DocumentReference } from "./db";
import { doc, db, getDoc, previousStats, setDoc, deleteDoc } from "./db";
import {
	authJoin,
	authLeave,
	authLogIn,
	authLogOut,
	authRefreshSession,
	authUpdateAccountId,
	authUpdatePassword,
	getFrom,
	postTo,
} from "./api-types/index.js";

function authRef(uid: string): DocumentReference<KeyMaterial> {
	return doc<KeyMaterial>(db, "keys", uid);
}

export async function getAuthMaterial(uid: string): Promise<KeyMaterial | null> {
	const snap = await getDoc(authRef(uid));
	return snap.data() ?? null;
}

export async function setAuthMaterial(uid: string, data: KeyMaterial): Promise<void> {
	await setDoc(authRef(uid), data);
}

export async function deleteAuthMaterial(uid: string): Promise<void> {
	await deleteDoc(authRef(uid));
}

export interface User {
	/**
	 * The account ID of the user.
	 */
	readonly accountId: Readonly<string>;
	/**
	 * The user's unique ID, scoped to the instance.
	 */
	readonly uid: Readonly<string>;
}

export interface UserCredential {
	/**
	 * The user authenticated by this credential.
	 */
	user: User;
}

/**
 * Creates a new user account associated with the specified account ID and password.
 *
 * @remarks
 * On successful creation of the user account, this user will also be signed in to your application.
 *
 * User account creation can fail if the account already exists or the password is invalid.
 *
 * Note: The account ID acts as a unique identifier for the user. This function will create a new user account and set the initial user password.
 *
 * @param db - The {@link AccountableDB} instance.
 * @param account - The user's account ID.
 * @param password - The user's chosen password.
 */
export async function createUserWithAccountIdAndPassword(
	db: AccountableDB,
	account: string,
	password: string
): Promise<UserCredential> {
	// TODO: I18N
	if (!account) throw new TypeError("accountID parameter cannot be empty");
	if (!password) throw new TypeError("password parameter cannot be empty");

	const join = new URL(authJoin(), db.url);
	const { access_token, uid, usedSpace, totalSpace } = await postTo(join, { account, password });
	if (access_token === undefined || uid === undefined)
		throw new TypeError("Expected access token from server, but got none"); // TODO: I18N

	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;

	const user: User = { accountId: account, uid };
	db.setUser(user);
	return { user };
}

/**
 * Signs out the current user.
 *
 * @param db - The {@link AccountableDB} instance.
 *
 * @throws a `NetworkError` if something goes wrong with the request.
 */
export async function signOut(db: AccountableDB): Promise<void> {
	const logout = new URL(authLogOut(), db.url);
	await postTo(logout, {});
	db.clearUser();
	previousStats.usedSpace = null;
	previousStats.totalSpace = null;
}

/**
 * Asynchronously signs in using an account ID and password.
 *
 * @remarks
 * Fails with an error if the account ID and password do not match.
 *
 * Note: The
 * account ID serves as a unique identifier for the user, and the password is used to access
 * the user's account in your Accountable instance. See also: {@link createUserWithAccountIdAndPassword}.
 *
 * @param db - The {@link AccountableDB} instance.
 * @param account - The user's account ID.
 * @param password - The user's password.
 *
 * @throws a `NetworkError` if something goes wrong with the request.
 */
export async function signInWithAccountIdAndPassword(
	db: AccountableDB,
	account: string,
	password: string
): Promise<UserCredential> {
	// TODO: I18N
	if (!account) throw new TypeError("accountID parameter cannot be empty");
	if (!password) throw new TypeError("password parameter cannot be empty");

	const login = new URL(authLogIn(), db.url);
	const { access_token, uid, usedSpace, totalSpace } = await postTo(login, { account, password });
	if (access_token === undefined || uid === undefined)
		throw new TypeError("Expected access token from server, but got none"); // TODO: I18N

	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;

	const user: User = { accountId: account, uid };
	db.setUser(user);
	return { user };
}

/**
 * Asynchronously refreshes the login token
 *
 * @param db - The {@link AccountableDB} instance.
 *
 * @throws a `NetworkError` if something goes wrong with the request.
 */
export async function refreshSession(db: AccountableDB): Promise<UserCredential> {
	const session = new URL(authRefreshSession(), db.url);
	const { account, access_token, uid, usedSpace, totalSpace } = await getFrom(session);
	if (account === undefined || access_token === undefined || uid === undefined)
		throw new TypeError("Expected access token from server, but got none"); // TODO: I18N

	previousStats.usedSpace = usedSpace ?? null;
	previousStats.totalSpace = totalSpace ?? null;

	const user: User = { accountId: account, uid };
	db.setUser(user);
	return { user };
}

/**
 * Deletes and signs out the user.
 *
 * @param db - The {@link AccountableDB} instance.
 * @param user - The user.
 * @param password - The user's chosen password.
 *
 * @throws a `NetworkError` if something goes wrong with the request.
 */
export async function deleteUser(db: AccountableDB, user: User, password: string): Promise<void> {
	if (!password) throw new TypeError("password parameter cannot be empty"); // TODO: I18N

	const leave = new URL(authLeave(), db.url);
	await postTo(leave, {
		account: user.accountId,
		password,
	});
}

/**
 * Updates the user's account ID.
 *
 * @param user - The user.
 * @param newAccountId - The new account ID.
 * @param password - The user's chosen password.
 *
 * @throws a `NetworkError` if something goes wrong with the request.
 */
export async function updateAccountId(
	user: User,
	newAccountId: string,
	password: string
): Promise<void> {
	// TODO: I18N
	if (!newAccountId) throw new TypeError("accountID parameter cannot be empty");
	if (!password) throw new TypeError("password parameter cannot be empty");

	const updateaccountid = new URL(authUpdateAccountId(), db.url);
	await postTo(updateaccountid, {
		account: user.accountId,
		newaccount: newAccountId,
		password,
	});
}

/**
 * Updates the user's password.
 *
 * @param db - The {@link AccountableDB} instance.
 * @param user - The user.
 * @param oldPassword - The old password.
 * @param newPassword - The new password.
 *
 * @throws a `NetworkError` if something goes wrong with the request.
 */
export async function updatePassword(
	db: AccountableDB,
	user: User,
	oldPassword: string,
	newPassword: string
): Promise<void> {
	// TODO: I18N
	if (!oldPassword) throw new TypeError("old-password parameter cannot be empty");
	if (!newPassword) throw new TypeError("new-password parameter cannot be empty");

	const updatepassword = new URL(authUpdatePassword(), db.url);
	await postTo(updatepassword, {
		account: user.accountId,
		password: oldPassword,
		newpassword: newPassword,
	});
}
