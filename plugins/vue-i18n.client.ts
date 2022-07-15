import { defineNuxtPlugin } from "#imports";
import { i18n } from "~~/locales/client.js";

export default defineNuxtPlugin(nuxtApp => {
	nuxtApp.vueApp.use(i18n);
});
