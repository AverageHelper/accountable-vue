import { computed, defineNuxtPlugin } from "#imports";
import { createI18n } from "vue-i18n";
import enUS from "../locales/en-US.json";

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
		...strings.meta,
		code: code as LocaleCode,
	}));

// **
// ** Set up Vue I18N Runtime **
// **

export const DEFAULT_LOCALE_CODE = "en-US";

// Read ?lang query to get preferred locale
const LOCALE_PARAM = "lang";
const preferredLocale =
	typeof location !== "undefined" // `location` is undefined in Jest
		? new URLSearchParams(location.search).get(LOCALE_PARAM)
		: DEFAULT_LOCALE_CODE;

const locale = isSupportedLocaleCode(preferredLocale) ? preferredLocale : DEFAULT_LOCALE_CODE;

export const i18n = createI18n({
	locale,
	fallbackLocale: DEFAULT_LOCALE_CODE,
	globalInjection: true,
	messages,
});

export default defineNuxtPlugin(nuxtApp => {
	nuxtApp.vueApp.use(i18n);
});

/** Locale message translation. */
export const t = (k: string): string => i18n.global.t(k);

export function setLocale(code: LocaleCode): void {
	i18n.global.locale = code;
	console.debug(`Locale: ${locale} ${messages[locale].meta.flag}`);
}

/** The user's selected locale. */ // FIXME: Should this be in a Pinia store?
export const currentLocale = computed(() => messages[i18n.global.locale as LocaleCode].meta);
setLocale(locale); // log the current locale to console
