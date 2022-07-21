/* eslint-disable unicorn/filename-case */
import { SvelteComponentTyped } from "svelte/internal";

export interface I18NProps {
	keypath: string;
	tag: keyof HTMLElementTagNameMap;
	class?: string;
}

export interface I18NEvents {}

// Any slot name is valid
export interface I18NSlots extends Record<string, undefined> {}

declare class I18NComponent extends SvelteComponentTyped<I18NProps, I18NEvents, I18NSlots> {}

export default I18NComponent;
