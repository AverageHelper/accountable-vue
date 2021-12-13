export class TemporarySet<T> {
	#deletions: Map<T, NodeJS.Timeout>;

	constructor() {
		this.#deletions = new Map();
	}

	add(value: T, timeout: number): void {
		const timer = setTimeout(() => this.delete(value), timeout);
		this.#deletions.set(value, timer);
	}

	delete(value: T): void {
		const timer = this.#deletions.get(value);
		if (timer) {
			clearTimeout(timer);
			this.#deletions.delete(value);
		}
	}

	has(value: T): boolean {
		return this.#deletions.has(value);
	}
}
