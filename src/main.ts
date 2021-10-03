import { createPinia } from "pinia";
import { createApp } from "vue";
import { bootstrap } from "./db/wrapper";
import { router } from "./router";
import App from "./App.vue";

bootstrap();

createApp(App) //
	.use(createPinia())
	.use(router)
	.mount("#app");
