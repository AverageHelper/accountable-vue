/** A set that stores the provided values for only the given number of milliseconds. */
export class TemporarySet<T> {
	#storage: Map<T, NodeJS.Timeout>;

	constructor() {
		this.#storage = new Map();
	}

	get size(): number {
		return this.#storage.size;
	}

	add(value: T, timeout: number): void {
		if (timeout < 0) throw new RangeError("timeout must be greater than or equal to zero");
		if (Number.isNaN(timeout)) throw new RangeError("timeout must not be NaN");
		const timer = setTimeout(() => this.delete(value), timeout);
		this.#storage.set(value, timer);
	}

	delete(value: T): void {
		const timer = this.#storage.get(value);
		if (timer) {
			clearTimeout(timer);
			this.#storage.delete(value);
		}
	}

	has(value: T): boolean {
		return this.#storage.has(value);
	}

	toString(): string {
		return `TemporarySet<${this.size} value${this.size === 1 ? "" : "s"}>`;
	}
}
