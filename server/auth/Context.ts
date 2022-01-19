import type { Request } from "express";

/** @see https://boltsource.io/blog/Request-Context-with-TypeScript-and-express/ */
export class Context {
	private static readonly _bindings = new WeakMap<Request<unknown>, Context>();

	public readonly uid: Readonly<string>;

	constructor(uid: string) {
		this.uid = uid;
	}

	static bind(req: Request, uid: string): void {
		const ctx = new Context(uid);
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
