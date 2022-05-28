import type { Component } from "vue";
import AccountIcon from "../../icons/IdCard.vue";
import FileIcon from "../../icons/File.vue";
import LocationIcon from "../../icons/Location.vue";
import TagIcon from "../../icons/Tag.vue";
import { accounts, attachments, locations, tags } from "router";

export type Tab = "accounts" | "attachments" | "locations" | "tags";

export const appTabs: ReadonlyArray<Tab> = ["accounts", "attachments", "locations", "tags"];

export function isAppTab(tbd: string): tbd is Tab {
	return (appTabs as Array<string>).includes(tbd);
}

export function labelForTab(tab: Tab): string {
	switch (tab) {
		case "accounts":
			return "Accounts";
		case "attachments":
			return "Files";
		case "locations":
			return "Locations";
		case "tags":
			return "Tags";
		default:
			return "Page";
	}
}

export function routeForTab(tab: Tab): string {
	switch (tab) {
		case "accounts":
			return accounts();
		case "attachments":
			return attachments();
		case "locations":
			return locations();
		case "tags":
			return tags();
		default:
			return "#";
	}
}

export function iconForTab(tab: Tab): Component | null {
	switch (tab) {
		case "accounts":
			return AccountIcon;
		case "attachments":
			return FileIcon;
		case "locations":
			return LocationIcon;
		case "tags":
			return TagIcon;
		default:
			return null;
	}
}
