import type { Adapter, AdapterPayload } from "oidc-provider";

interface Thing {
	id: string;
	payload: AdapterPayload;
	expiresIn: number;
}

export class OIDCAdapter implements Adapter {
	// TODO: This should get stuff from a database instead
	#stuffs: Record<string, Thing> = {};

	async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
		this.#stuffs[id] = { id, payload, expiresIn };
	}

	async find(id: string): Promise<AdapterPayload | undefined> {
		return this.#stuffs[id]?.payload;
	}

	async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
		return this.#stuffs[userCode]?.payload;
	}

	async findByUid(uid: string): Promise<AdapterPayload | undefined> {
		return this.#stuffs[uid]?.payload;
	}

	async consume(id: string): Promise<void> {
		delete this.#stuffs[id];
	}

	async destroy(id: string): Promise<void> {
		delete this.#stuffs[id];
	}

	async revokeByGrantId(grantId: string): Promise<void> {
		delete this.#stuffs[grantId];
	}
}

const client_secret = process.env.OIDC_SECRET;
if (client_secret === undefined || typeof client_secret !== "string")
	throw new TypeError("Missing value for key 'OIDC_SECRET'. Set this value in .env to continue.");

export { client_secret };
