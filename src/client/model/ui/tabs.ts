export type Tab = "accounts" | "attachments" | "tags";

export const allTabs: ReadonlyArray<Tab> = ["accounts", "attachments", "tags"];

export function isTab(tbd: string): tbd is Tab {
	return (allTabs as Array<string>).includes(tbd);
}
