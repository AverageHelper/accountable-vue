export function toTimestamp(date: Date): string {
	const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
	return formatter.format(date);
}
