import type { ComponentType } from "svelte";
import { accountsPath, attachmentsPath, locationsPath, tagsPath } from "router";
import AccountIcon from "../../icons/IdCard.svelte";
import FileIcon from "../../icons/File.svelte";
import LocationIcon from "../../icons/Location.svelte";
import TagIcon from "../../icons/Tag.svelte";

export const appTabs = ["accounts", "attachments", "locations", "tags"] as const;

export type Tab = typeof appTabs[number];

export function isAppTab(tbd: string): tbd is Tab {
	return appTabs.includes(tbd as Tab);
}

export function labelIdForTab(tab: Tab): `app.nav.${typeof tab}` | "app.nav.generic-page" {
	if (isAppTab(tab)) return `app.nav.${tab}`;
	return "app.nav.generic-page";
}

export function routeForTab(tab: Tab): `/${typeof tab}` | "#" {
	switch (tab) {
		case "accounts":
			return accountsPath();
		case "attachments":
			return attachmentsPath();
		case "locations":
			return locationsPath();
		case "tags":
			return tagsPath();
		default:
			return "#";
	}
}

export function iconForTab(tab: Tab): ComponentType | null {
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
