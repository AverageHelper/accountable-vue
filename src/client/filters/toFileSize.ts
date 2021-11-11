export function toFileSize(num: number): string {
	if (Number.isNaN(num)) {
		return "NaN B";
	}

	const neg = num < 0;
	const units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	if (neg) {
		num = -num;
	}

	if (num < 1) {
		return `${(neg ? "-" : "") + num.toString()} B`;
	}

	const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
	num /= 1000 ** exponent;
	const unit = units[exponent] ?? "...";

	return `${(neg ? "-" : "") + num.toFixed(2)} ${unit}`;
}
