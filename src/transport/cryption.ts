export interface EPackage<M> {
	payload: string;
	metadata: M;
}

export class DecryptionError extends Error {
	constructor() {
		super("Check your password and try again.");
		this.name = "DecryptionError";
	}
}

export function encrypt<M extends Record<string, unknown>>(
	passphrase: string,
	payload: unknown,
	metadata: M
): EPackage<M> {
	return {
		payload: JSON.stringify(payload),
		metadata,
	};
}

export function decrypt<M extends Record<string, unknown>>(
	passphrase: string,
	pkg: EPackage<M>
): unknown {
	return JSON.parse(pkg.payload);
}
