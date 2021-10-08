import AES from "crypto-js/aes";
import CryptoJS from "crypto-js";
import forge from "node-forge";
import atob from "atob-lite";
import btoa from "btoa-lite";

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
}

export interface EPackage<M> {
	ciphertext: string;
	metadata: M;
}

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
}

const ITERATIONS = 10000;

async function random(byteCount: number): Promise<string> {
	return new Promise((resolve, reject) => {
		forge.random.getBytes(byteCount, (err, bytes) => {
			if (err) {
				return reject(err);
			}
			return resolve(bytes);
		});
	});
}

export function derivePKey(password: string, salt: string): string {
	return forge.pkcs5.pbkdf2(password, salt, ITERATIONS, 256);
}

export async function newDataEncryptionKeyMaterial(password: string): Promise<KeyMaterial> {
	// To make password de-derivation harder
	const passSalt = btoa(await random(32));
	// To encrypt data
	const dek = await random(256);

	// To encrypt the dek
	const pKey = derivePKey(password, passSalt);
	const dekMaterial = AES.encrypt(dek, pKey).ciphertext.toString();

	return { dekMaterial, passSalt };
}

/**
 * Serializes data to be stored in untrusted environments.
 *
 * @param dek The data en/decryption key.
 * @param data The data to encrypt.
 * @param metadata Metadata to be stored in plaintext about the data.
 * @returns An object that can be stored in Firestore.
 */
export function encrypt<M>(data: unknown, metadata: M, dek: string): EPackage<M> {
	const plaintext = JSON.stringify(data);
	const ciphertext = btoa(AES.encrypt(plaintext, dek).toString());

	return { ciphertext, metadata };
}

/**
 * Deserializes encrypted data.
 *
 * @param dek The data en/decryption key.
 * @param pkg The object that was stored in Firestore.
 * @returns The original data.
 */
export function decrypt<M>(pkg: EPackage<M>, dek: string): unknown {
	const { ciphertext } = pkg;
	const plaintext = AES.decrypt(atob(ciphertext), dek).toString(CryptoJS.enc.Utf8);

	if (!plaintext) {
		throw new DecryptionError("Result was empty");
	}

	try {
		return JSON.parse(plaintext) as unknown;
	} catch (error: unknown) {
		if (error instanceof Error) {
			throw new DecryptionError(`JSON parse failed: ${error.message}: '${plaintext}'`);
		} else {
			throw new DecryptionError(`JSON parse failed: ${JSON.stringify(error)}: '${plaintext}'`);
		}
	}
}
