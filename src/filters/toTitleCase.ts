export function toTitleCase(str: string): string;
export function toTitleCase(str: null): null;
export function toTitleCase(str: undefined): undefined;

export function toTitleCase(str: string | null | undefined): string | null | undefined {
	if (str === null || str === undefined) {
		return str;
	}

	const first = str[0];
	if (first === undefined || !first) {
		return str;
	}

	const rest = str.slice(1);
	return `${first.toUpperCase()}${rest}`;
}
