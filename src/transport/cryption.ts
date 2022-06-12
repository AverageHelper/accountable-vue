import atob from "atob-lite";
import AES from "crypto-js/aes";
import btoa from "btoa-lite";
import CryptoJS from "crypto-js";
import isString from "lodash/isString";

class DecryptionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DecryptionError";
	}
}

/**
 * Encryption materials that live on Firestore.
 * This data is useless without the user's password.
 */
export interface KeyMaterial {
	dekMaterial: string;
	passSalt: string;
	oldDekMaterial?: string;
	oldPassSalt?: string;
}

export type EPackage<M> = M & {
	ciphertext: string;
};

export type DEKMaterial = CryptoJS.lib.CipherParams;

export class HashStore {
	private _hashedValue: string;

	constructor(value: string) {
		this._hashedValue = btoa(value);
	}

	get value(): Readonly<string> {
		return atob(this._hashedValue);
	}

	/** Overwrites the buffer with random data for _maximum paranoia_ */
	destroy(): void {
		const length = this._hashedValue.length;
		let result = "";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		this._hashedValue = result;
	}

	toString(): string {
		return JSON.stringify({
			_hashedValue: this._hashedValue,
		});
	}
}

const ITERATIONS = 10000;

function random(byteCount: number): string {
	return CryptoJS.lib.WordArray.random(byteCount).toString(CryptoJS.enc.Base64);
}

/** Makes special potatoes that are unique to the `input`. */
export async function hashed(input: string): Promise<string> {
	return btoa((await derivePKey(input, "salt")).value);
}

export async function derivePKey(password: string, salt: string): Promise<HashStore> {
	await new Promise(resolve => setTimeout(resolve, 10)); // wait 10 ms for UI
	return new HashStore(
		CryptoJS.PBKDF2(password, salt, {
			iterations: ITERATIONS,
			hasher: CryptoJS.algo.SHA512,
			keySize: 256,
		}).toString(CryptoJS.enc.Base64)
	);
}

export function deriveDEK(pKey: HashStore, dekMaterial: string): HashStore {
	const dekObject = decrypt({ ciphertext: dekMaterial }, pKey);
	if (!isString(dekObject)) throw new TypeError("Decrypted key is malformatted"); // TODO: I18N?

	return new HashStore(atob(dekObject));
}

async function newDataEncryptionKeyMaterialForDEK(
	password: string,
	dek: HashStore
): Promise<KeyMaterial> {
	// To make passwords harder to guess
	const passSalt = btoa(random(32));

	// To encrypt the dek
	const pKey = await derivePKey(password, passSalt);
	const dekObject = btoa(dek.value);
	const dekMaterial = encrypt(dekObject, {}, pKey).ciphertext;

	return { dekMaterial, passSalt };
}

export async function newDataEncryptionKeyMaterial(password: string): Promise<KeyMaterial> {
	// To encrypt data
	const dek = new HashStore(random(256));
	return await newDataEncryptionKeyMaterialForDEK(password, dek);
}

export async function newMaterialFromOldKey(
	oldPassword: string,
	newPassword: string,
	oldKey: KeyMaterial
): Promise<KeyMaterial> {
	const oldPKey = await derivePKey(oldPassword, oldKey.passSalt);
	const dek = deriveDEK(oldPKey, oldKey.dekMaterial);
	const newPKey = await newDataEncryptionKeyMaterialForDEK(newPassword, dek);

	return {
		dekMaterial: newPKey.dekMaterial,
		passSalt: newPKey.passSalt,
		oldDekMaterial: oldKey.dekMaterial,
		oldPassSalt: oldKey.passSalt,
	};
}

/**
 * Serializes data to be stored in untrusted environments.
 *
 * @param data The data to encrypt.
 * @param metadata Metadata to be stored in plaintext about the data.
 * @param dek The data en/decryption key.
 * @returns An object that can be stored in Firestore.
 */
export function encrypt<M>(data: unknown, metadata: M, dek: HashStore): EPackage<M> {
	const plaintext = JSON.stringify(data);
	const ciphertext = AES.encrypt(plaintext, dek.value).toString();

	return { ciphertext, ...metadata };
}

/**
 * Deserializes encrypted data.
 *
 * @param pkg The object that was stored in Firestore.
 * @param dek The data en/decryption key.
 * @returns The original data.
 */
export function decrypt(pkg: Pick<EPackage<unknown>, "ciphertext">, dek: HashStore): unknown {
	const { ciphertext } = pkg;
	const plaintext = AES.decrypt(ciphertext, dek.value).toString(CryptoJS.enc.Utf8);

	if (!plaintext) {
		throw new DecryptionError("Result was empty");
	}

	try {
		return JSON.parse(plaintext) as unknown;
	} catch (error) {
		// TODO: I18N?
		if (error instanceof Error) {
			throw new DecryptionError(`JSON parse failed: ${error.message}: '${plaintext}'`);
		} else {
			throw new DecryptionError(`JSON parse failed: ${JSON.stringify(error)}: '${plaintext}'`);
		}
	}
}
