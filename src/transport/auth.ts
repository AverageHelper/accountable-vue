import type { KeyMaterial } from "./cryption";
import type { AccountableDB, DocumentReference } from "./db";
import { AccountableError, doc, db, getDoc, setDoc, deleteDoc } from "./db";

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
 * @param accountId - The user's account ID.
 * @param password - The user's chosen password.
 */
export async function createUserWithAccountIdAndPassword(
	db: AccountableDB,
	accountId: string,
	password: string
): Promise<UserCredential> {
	if (!accountId) throw new TypeError("accountID parameter cannot be empty");
	if (!password) throw new TypeError("password parameter cannot be empty");
	// TODO: Do account activity
	throw new AccountableError("auth/invalid-argument");
}

/**
 * Signs out the current user.
 *
 * @param auth - The {@link AccountableDB} instance.
 */
export async function signOut(db: AccountableDB): Promise<void> {
	// TODO: Do account activity
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
 * @param accountId - The user's account ID.
 * @param password - The user's password.
 */
export async function signInWithAccountIdAndPassword(
	db: AccountableDB,
	accountId: string,
	password: string
): Promise<UserCredential> {
	// TODO: Do account activity
	throw new AccountableError("auth/invalid-argument");
}

/**
 * Deletes and signs out the user.
 *
 * @param db - The {@link AccountableDB} instance.
 * @param user - The user.
 * @param password - The user's chosen password.
 */
export async function deleteUser(db: AccountableDB, user: User, password: string): Promise<void> {
	// TODO: Do account activity
}

/**
 * Updates the user's account ID.
 *
 * @param user - The user.
 * @param newAccountId - The new account ID.
 * @param password - The user's chosen password.
 */
export async function updateAccountId(
	user: User,
	newAccountId: string,
	password: string
): Promise<void> {
	// TODO: Do account activity
}

/**
 * Updates the user's password.
 *
 * @param db - The {@link AccountableDB} instance.
 * @param user - The user.
 * @param oldPassword - The old password.
 * @param newPassword - The new password.
 */
export async function updatePassword(
	db: AccountableDB,
	user: User,
	oldPassword: string,
	newPassword: string
): Promise<void> {
	// TODO: Do account activity
}
