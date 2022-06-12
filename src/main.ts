import "source-map-support/register";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { i18n } from "./i18n";
import { router } from "./router";
import App from "./App.vue";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

createApp(App) //
	.use(createPinia())
	.use(router)
	.use(Toast)
	.use(i18n)
	.mount("#app");
