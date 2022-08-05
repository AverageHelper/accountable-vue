import { addMessages, init, getLocaleFromNavigator } from "svelte-i18n";
import enUS from "./locales/en-US.json";

const messages = {
	"en-US": enUS,
} as const;

export type LocaleCode = keyof typeof messages;

/** Returns `true` if the given string is a supported locale code. */
export function isSupportedLocaleCode(tbd: string | null): tbd is LocaleCode {
	if (tbd === null) return false;
	return Object.keys(messages).includes(tbd);
}

export interface LocaleDescriptor {
	/** The locale code. @example `"en-US"` */
	readonly code: LocaleCode;

	/** An emoji flag representing the locale. @example `"🇺🇸"` */
	readonly flag: string;

	/** A string describing the locale to visually-impaired readers. @example `"English (United States)"` */
	readonly language: string;
}

/** The list of supported locales. */
export const locales: ReadonlyArray<LocaleDescriptor> = Object.entries(messages) //
	.map(([code, strings]) => ({
		code: code as LocaleCode,
		language: strings.meta.language,
		flag: strings.meta.flag,
	}));

// **
// ** Set up Svelte I18N Runtime **
// **

const fallbackLocale = "en-US";

// TODO: Read ?lang query to get preferred locale
// const LOCALE_PARAM = "lang";
// const initialLocale =
// 	typeof location !== "undefined" // `location` is undefined in Jest
// 		? new URLSearchParams(location.search).get(LOCALE_PARAM)
// 		: fallbackLocale;

const initialLocale = getLocaleFromNavigator();
console.debug(`Locale: ${initialLocale ?? "null"}`);

Object.entries(messages).forEach(([locale, partials]) => {
	addMessages(locale, partials);
});

// Initialize Svelte I18N
console.debug("Loading I18N module...");
void init({
	fallbackLocale,
	initialLocale,
});
console.debug("I18N module loaded");
