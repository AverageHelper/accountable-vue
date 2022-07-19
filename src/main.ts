import "source-map-support/register";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { router } from "./router";
import App from "./App.svelte";

// Initialize Svelte app
new App({
	target: document.body,
});

createApp(App) //
	.use(createPinia())
	.use(router)
	.mount("#app");
