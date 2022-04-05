import type { DataSource } from "../database/schemas.js";
import type { Request } from "express";

/**
 * A representation of the session context.
 *
 * @see https://boltsource.io/blog/Request-Context-with-TypeScript-and-express/
 */
export class Context {
	private static readonly _bindings = new WeakMap<Request<unknown>, Context>();

	public readonly uid: Readonly<string>;
	public readonly source: DataSource;

	constructor(uid: string, source: DataSource) {
		this.uid = uid;
		this.source = source;
	}

	static bind(req: Request, params: { uid: string; source: DataSource }): void {
		const ctx = new Context(params.uid, params.source);
		Context._bindings.set(req, ctx);
	}

	static get<P = unknown>(req: Request<P>): Context | null {
		return Context._bindings.get(req) ?? null;
	}

	toString(): string {
		return JSON.stringify({
			uid: this.uid,
		});
	}
}
