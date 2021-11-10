export type Tab = "accounts" | "tags";

export const allTabs: ReadonlyArray<Tab> = ["accounts", "tags"];

export function isTab(tbd: string): tbd is Tab {
	return (allTabs as Array<string>).includes(tbd);
}
