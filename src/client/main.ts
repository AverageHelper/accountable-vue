import "source-map-support/register";
import { createPinia } from "pinia";
import { createApp } from "vue";
import { router } from "./router";
import Toast from "vue-toastification";
import App from "./App.vue";
import "vue-toastification/dist/index.css";

createApp(App) //
	.use(createPinia())
	.use(router)
	.use(Toast)
	.mount("#app");
