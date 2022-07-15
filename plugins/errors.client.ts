import { defineNuxtPlugin } from "#imports";

export default defineNuxtPlugin(nuxtApp => {
	nuxtApp.vueApp.config.errorHandler = (error, context): void => {
		console.error("Vue error encountered:", error, context);
	};
});
