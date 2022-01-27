export type Tab = "accounts" | "attachments" | "locations" | "tags";

export const appTabs: ReadonlyArray<Tab> = ["accounts", "attachments", "locations", "tags"];

export function isAppTab(tbd: string): tbd is Tab {
	return (appTabs as Array<string>).includes(tbd);
}
